import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import {
  connectorSchemaSyncs,
  connectorTables,
} from "@/lib/db/schema/connector-schema";

import {
  buildTargetDescriptorHash,
  type DiscoveryRecord,
} from "./identity";
import type { SchemaSnapshot } from "./snapshot";

/** Thrown when the connector changed under the refresh; rolls back the apply. */
export class TargetChangedError extends Error {
  constructor() {
    super("Connector target changed during refresh");
  }
}

export type ReconcileInput = {
  workspaceId: string;
  connectionId: string;
  /** Epoch this sync targets (already the post-bump value). */
  sourceEpoch: number;
  epochBumped: boolean;
  syncId: string;
  targetHash: string;
  snapshot: SchemaSnapshot;
};

export type ReconcileOutcome = { tableCount: number };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ExistingRow = typeof connectorTables.$inferSelect;

const now = () => new Date();
const nameKey = (schemaName: string, tableName: string) =>
  `${schemaName}\u0000${tableName}`;

/**
 * Apply a complete snapshot to app metadata in one transaction, together with
 * the succeeded sync result. Never touches connector_table_contexts: app IDs
 * and explanations survive renames because matched rows are updated in place.
 */
export async function applySnapshot(
  input: ReconcileInput,
): Promise<ReconcileOutcome> {
  return db.transaction(async (tx) => {
    const [connection] = await tx
      .select()
      .from(connections)
      .where(eq(connections.id, input.connectionId))
      .for("update");
    if (!connection || connection.deletedAt) throw new TargetChangedError();
    const currentHash = buildTargetDescriptorHash({
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      sqliteFileKey: connection.sqliteFileKey,
    });
    if (currentHash !== input.targetHash) throw new TargetChangedError();

    if (input.epochBumped) {
      await tx
        .update(connections)
        .set({ sourceEpoch: input.sourceEpoch })
        .where(eq(connections.id, input.connectionId));
      // Preserve the previous epoch's records for review; never auto-match
      // them against a fresh set after a target/restore event.
      await tx
        .update(connectorTables)
        .set({
          status: "needs-review",
          reviewReason: "epoch_changed",
          updatedAt: now(),
        })
        .where(
          and(
            eq(connectorTables.connectionId, input.connectionId),
            eq(connectorTables.sourceEpoch, input.sourceEpoch - 1),
            ne(connectorTables.status, "removed"),
          ),
        );
      await insertFreshSet(tx, input);
      return finalizeSync(tx, input);
    }
    await reconcileSameEpoch(tx, input);
    return finalizeSync(tx, input);
  });
}

/** Same-epoch reconciliation against active/needs-review rows. */
async function reconcileSameEpoch(tx: Tx, input: ReconcileInput) {
  const existing = await tx
    .select()
    .from(connectorTables)
    .where(
      and(
        eq(connectorTables.connectionId, input.connectionId),
        eq(connectorTables.sourceEpoch, input.sourceEpoch),
        ne(connectorTables.status, "removed"),
      ),
    );
  const byNative = new Map(
    existing
      .filter((row) => row.sourceObjectId !== null)
      .map((row) => [row.sourceObjectId as string, row]),
  );
  const byName = new Map(
    existing.map((row) => [nameKey(row.schemaName, row.tableName), row]),
  );
  const stamp = now();
  const seenNames = new Set<string>();
  const seenNative = new Set<string>();

  for (const record of input.snapshot.objects) {
    seenNames.add(nameKey(record.schemaName, record.tableName));
    if (record.sourceObjectId !== null) seenNative.add(record.sourceObjectId);
    const nativeMatch =
      record.sourceObjectId !== null
        ? byNative.get(record.sourceObjectId)
        : undefined;
    const nameMatch = byName.get(nameKey(record.schemaName, record.tableName));

    if (nativeMatch) {
      await updateSeenRow(tx, input, nativeMatch, record, stamp, null);
    } else if (nameMatch && record.sourceObjectId === null) {
      // Name-only continuity. If the row previously had a native ID and the
      // snapshot lost ID visibility, identity is uncertain: require review.
      const visibilityLost =
        nameMatch.sourceObjectId !== null && input.snapshot.nameOnlyFallback;
      await updateSeenRow(
        tx,
        input,
        nameMatch,
        record,
        stamp,
        visibilityLost ? "source_identity_unavailable" : null,
      );
    } else if (nameMatch && nameMatch.sourceObjectId === null) {
      // Visibility improved: adopt the newly exposed native ID in place.
      nameMatch.sourceObjectId = record.sourceObjectId;
      await updateSeenRow(tx, input, nameMatch, record, stamp, null);
    } else if (nameMatch) {
      // Same qualified name with a different native ID is a NEW object, not a
      // rename. The old object is proven gone; retain its context for review.
      await tx
        .update(connectorTables)
        .set({
          status: "removed",
          reviewReason: "dropped_or_replaced",
          removedAt: stamp,
          updatedAt: stamp,
        })
        .where(eq(connectorTables.id, nameMatch.id));
      await insertDiscovered(tx, input, record, stamp);
    } else {
      await insertDiscovered(tx, input, record, stamp);
    }
  }

  // Existing rows absent from the snapshot: only mark removed when deletion
  // is proven; uncertain disappearances become needs-review.
  for (const row of existing) {
    if (
      seenNames.has(nameKey(row.schemaName, row.tableName)) ||
      (row.sourceObjectId !== null && seenNative.has(row.sourceObjectId))
    )
      continue;
    const provenDropped =
      row.sourceObjectId !== null &&
      !input.snapshot.nameOnlyFallback &&
      !input.snapshot.outOfScopeNativeIds.has(row.sourceObjectId);
    await tx
      .update(connectorTables)
      .set({
        status: provenDropped ? "removed" : "needs-review",
        reviewReason: provenDropped
          ? "missing_from_source"
          : row.sourceObjectId !== null && !input.snapshot.nameOnlyFallback
            ? "outside_discovery_scope"
            : "missing_from_snapshot",
        removedAt: provenDropped ? stamp : null,
        updatedAt: stamp,
      })
      .where(eq(connectorTables.id, row.id));
  }
}

/** Epoch bump path: insert the snapshot as a fresh set for the new epoch. */
async function insertFreshSet(tx: Tx, input: ReconcileInput) {
  const stamp = now();
  for (const record of input.snapshot.objects)
    await insertDiscovered(tx, input, record, stamp);
}

async function insertDiscovered(
  tx: Tx,
  input: ReconcileInput,
  record: DiscoveryRecord,
  stamp: Date,
) {
  await tx.insert(connectorTables).values({
    workspaceId: input.workspaceId,
    connectionId: input.connectionId,
    sourceEpoch: input.sourceEpoch,
    sourceObjectId: record.sourceObjectId,
    schemaName: record.schemaName,
    tableName: record.tableName,
    objectType: record.objectType,
    databaseComment: record.databaseComment,
    fingerprint: record.fingerprint,
    status: "active",
    lastSeenSyncId: input.syncId,
    lastSeenAt: stamp,
  });
}

/**
 * Update a matched row in place (rename-safe: the app ID and any context row
 * referencing it are untouched). Structural drift requires re-review.
 */
async function updateSeenRow(
  tx: Tx,
  input: ReconcileInput,
  row: ExistingRow,
  record: DiscoveryRecord,
  stamp: Date,
  reviewReason: string | null,
) {
  const structureChanged =
    reviewReason === null &&
    row.fingerprint !== null &&
    record.fingerprint !== null &&
    row.fingerprint !== record.fingerprint;
  await tx
    .update(connectorTables)
    .set({
      sourceObjectId: record.sourceObjectId ?? row.sourceObjectId,
      schemaName: record.schemaName,
      tableName: record.tableName,
      objectType: record.objectType,
      databaseComment: record.databaseComment,
      fingerprint: record.fingerprint,
      status:
        reviewReason !== null || structureChanged
          ? "needs-review"
          : "active",
      reviewReason:
        reviewReason ?? (structureChanged ? "structure_changed" : null),
      lastSeenSyncId: input.syncId,
      lastSeenAt: stamp,
      updatedAt: stamp,
    })
    .where(eq(connectorTables.id, row.id));
}

async function finalizeSync(
  tx: Tx,
  input: ReconcileInput,
): Promise<ReconcileOutcome> {
  const tableCount = input.snapshot.objects.length;
  await tx
    .update(connectorSchemaSyncs)
    .set({ status: "succeeded", tableCount, completedAt: now() })
    .where(eq(connectorSchemaSyncs.id, input.syncId));
  return { tableCount };
}
