import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import {
  connectorSchemaSyncs,
  connectorTables,
} from "@/lib/db/schema/connector-schema";

import { decryptSecret } from "../crypto";
import type { ServerProbeConfig } from "../probe";
import {
  applySnapshot,
  TargetChangedError,
} from "./apply";
import {
  SANITIZED_MESSAGES,
  type SyncErrorCode,
} from "./errors";
import { buildTargetDescriptorHash } from "./identity";
import {
  buildMongoSnapshot,
  buildPostgresSnapshot,
  SchemaSnapshot,
  SnapshotLimitError,
  SnapshotTimeoutError,
} from "./snapshot";

export type { SyncErrorCode };

export type RefreshSchemaResult = {
  syncId: string | null;
  status: "succeeded" | "failed";
  sourceEpoch: number;
  tableCount: number;
  errorCode: SyncErrorCode | null;
  errorMessage: string | null;
};

/** Minimum gap after a successful refresh before another may start. */
const SUCCESS_COOLDOWN_MS = 30_000;

function failed(
  syncId: string | null,
  sourceEpoch: number,
  code: SyncErrorCode,
): RefreshSchemaResult {
  return {
    syncId,
    status: "failed",
    sourceEpoch,
    tableCount: 0,
    errorCode: code,
    errorMessage: SANITIZED_MESSAGES[code],
  };
}

/**
 * Run one bounded schema refresh: acquire the per-connector sync lock, build a
 * complete discovery snapshot, then transactionally reconcile app metadata and
 * the succeeded sync record. Failures never mutate the last successful
 * snapshot. Explanations and app table IDs are preserved across renames.
 */
export async function refreshConnectorSchema(options: {
  workspaceId: string;
  connectionId: string;
  /** Audit only: who triggered the refresh. */
  userId?: string;
  /** User-declared restore/replacement: start a fresh epoch. */
  declareReplacement?: boolean;
}): Promise<RefreshSchemaResult> {
  const { workspaceId, connectionId, userId } = options;
  const [connection] = await db
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        eq(connections.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!connection || connection.deletedAt)
    return failed(null, 0, "connector_not_found");
  if (connection.type !== "postgres" && connection.type !== "mongodb")
    return failed(null, connection.sourceEpoch, "unsupported_connector_type");
  if (connection.status !== "connected")
    return failed(null, connection.sourceEpoch, "connector_not_connected");

  const targetFields = {
    type: connection.type,
    host: connection.host,
    port: connection.port,
    database: connection.database,
    sqliteFileKey: connection.sqliteFileKey,
  };
  const targetHash = buildTargetDescriptorHash(targetFields);
  // Spam guard: a successful snapshot is expensive, so rate-limit repeats.
  // Failures stay retryable immediately; in-flight runs are rejected by the
  // per-connector running-lock (unique index) below.
  const [lastSuccess] = await db
    .select({
      targetHash: connectorSchemaSyncs.targetHash,
      completedAt: connectorSchemaSyncs.completedAt,
    })
    .from(connectorSchemaSyncs)
    .where(
      and(
        eq(connectorSchemaSyncs.connectionId, connectionId),
        eq(connectorSchemaSyncs.status, "succeeded"),
      ),
    )
    .orderBy(desc(connectorSchemaSyncs.startedAt))
    .limit(1);
  if (
    lastSuccess?.completedAt &&
    Date.now() - lastSuccess.completedAt.getTime() < SUCCESS_COOLDOWN_MS
  )
    return failed(null, connection.sourceEpoch, "refresh_cooldown");
  const targetChanged =
    lastSuccess?.targetHash != null && lastSuccess.targetHash !== targetHash;
  const epochBumped = Boolean(options.declareReplacement || targetChanged);
  const sourceEpoch = epochBumped
    ? connection.sourceEpoch + 1
    : connection.sourceEpoch;

  let syncId: string;
  try {
    const inserted = await db
      .insert(connectorSchemaSyncs)
      .values({
        workspaceId,
        connectionId,
        sourceEpoch,
        status: "running",
        targetHash,
        createdBy: userId,
      })
      .returning({ id: connectorSchemaSyncs.id });
    syncId = inserted[0].id;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    )
      return failed(null, sourceEpoch, "refresh_already_running");
    throw error;
  }

  let snapshot: SchemaSnapshot;
  try {
    snapshot = await buildSnapshot(connection, targetFields, sourceEpoch, epochBumped);
  } catch (error) {
    const code = classifySnapshotError(error);
    await markFailed(syncId, code);
    return failed(syncId, sourceEpoch, code);
  }

  try {
    const outcome = await applySnapshot({
      workspaceId,
      connectionId,
      sourceEpoch,
      epochBumped,
      syncId,
      targetHash,
      snapshot,
    });
    return {
      syncId,
      status: "succeeded",
      sourceEpoch,
      tableCount: outcome.tableCount,
      errorCode: null,
      errorMessage: null,
    };
  } catch (error) {
    const code =
      error instanceof TargetChangedError
        ? "target_changed_during_refresh"
        : "apply_failed";
    await markFailed(syncId, code);
    return failed(syncId, sourceEpoch, code);
  }
}

async function buildSnapshot(
  connection: typeof connections.$inferSelect,
  targetFields: { type: string; host: string | null; port: number | null; database: string | null; sqliteFileKey: string | null },
  sourceEpoch: number,
  epochBumped: boolean,
): Promise<SchemaSnapshot> {
  const config: ServerProbeConfig = {
    type: connection.type as ServerProbeConfig["type"],
    host: connection.host ?? "",
    port: connection.port ?? 0,
    database: connection.database ?? "",
    username: connection.username ?? "",
    password: connection.passwordEncrypted
      ? decryptSecret(connection.passwordEncrypted)
      : "",
  };
  if (connection.type === "mongodb") return buildMongoSnapshot(config);
  return buildPostgresSnapshot(
    config,
    await loadNativeIds(connection.id, sourceEpoch, epochBumped),
  );
}

async function loadNativeIds(
  connectionId: string,
  sourceEpoch: number,
  epochBumped: boolean,
): Promise<string[]> {
  if (epochBumped) return [];
  const rows = await db
    .select({ sourceObjectId: connectorTables.sourceObjectId })
    .from(connectorTables)
    .where(
      and(
        eq(connectorTables.connectionId, connectionId),
        eq(connectorTables.sourceEpoch, sourceEpoch),
        eq(connectorTables.status, "active"),
        isNotNull(connectorTables.sourceObjectId),
      ),
    );
  return rows
    .map((row) => row.sourceObjectId)
    .filter((id): id is string => id !== null);
}

function classifySnapshotError(error: unknown): SyncErrorCode {
  if (error instanceof SnapshotLimitError) return "limit_exceeded";
  if (error instanceof SnapshotTimeoutError) return "timeout";
  return "snapshot_failed";
}

async function markFailed(syncId: string, code: SyncErrorCode) {
  await db
    .update(connectorSchemaSyncs)
    .set({
      status: "failed",
      errorCode: code,
      errorMessage: SANITIZED_MESSAGES[code],
      completedAt: new Date(),
    })
    .where(eq(connectorSchemaSyncs.id, syncId));
}
