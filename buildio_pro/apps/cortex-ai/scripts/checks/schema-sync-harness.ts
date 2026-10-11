import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { Client } from "pg";

import { encryptSecret } from "@/lib/connectors/crypto";
import type { DiscoveryRecord } from "@/lib/connectors/schema-sync/identity";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import { connectorTables } from "@/lib/db/schema/connector-schema";
import { workspaces } from "@/lib/db/schema/workspaces";

export const FIXTURE = {
  host: "localhost",
  port: 5434,
  database: "connector_test",
  user: "connector_test",
  password: "connector_test",
};

let passed = 0;
export function check(label: string, condition: boolean) {
  assert.ok(condition, `FAIL: ${label}`);
  passed += 1;
  console.log(`  ok - ${label}`);
}
export function passedCount() {
  return passed;
}

export type CheckTarget = {
  source: Client;
  workspaceId: string;
  connectionId: string;
  schemaName: string;
};

/** Open the fixture source and create an isolated app-side check target. */
export async function createCheckTarget(): Promise<CheckTarget> {
  const schemaName = `reconcile_check_${Math.random().toString(36).slice(2, 8)}`;
  const source = new Client(FIXTURE);
  await source.connect();
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: `schema-sync-check-${Date.now()}`,
      slug: `schema-sync-check-${randomUUID()}`,
    })
    .returning();
  const [connection] = await db
    .insert(connections)
    .values({
      workspaceId: workspace.id,
      name: "Reconciliation check",
      type: "postgres",
      host: FIXTURE.host,
      port: FIXTURE.port,
      database: FIXTURE.database,
      username: FIXTURE.user,
      passwordEncrypted: encryptSecret(FIXTURE.password),
      status: "connected",
    })
    .returning();
  return { source, workspaceId: workspace.id, connectionId: connection.id, schemaName };
}

export async function cleanupCheckTarget(target: CheckTarget) {
  await db.delete(workspaces).where(eq(workspaces.id, target.workspaceId));
  await target.source.query(
    `DROP SCHEMA IF EXISTS ${target.schemaName} CASCADE`,
  );
  await target.source.query(
    `DROP SCHEMA IF EXISTS ${target.schemaName}_archived CASCADE`,
  );
  await target.source.end();
}

export async function rowsFor(connectionId: string) {
  return db
    .select()
    .from(connectorTables)
    .where(eq(connectorTables.connectionId, connectionId));
}

export function discovery(
  oid: string | null,
  schema: string,
  name: string,
  fingerprint: string | null,
): DiscoveryRecord {
  return {
    sourceObjectId: oid,
    schemaName: schema,
    tableName: name,
    objectType: "table",
    databaseComment: null,
    fingerprint,
  };
}

/**
 * Apply a name-only-fallback snapshot directly, to exercise visibility-loss
 * handling: rows keep needs-review status instead of being removed.
 */
export async function applyFallbackSnapshot(
  target: CheckTarget,
  syncId: string,
  sourceEpoch: number,
  rows: Array<{ schemaName: string; tableName: string }>,
) {
  const { applySnapshot } = await import("@/lib/connectors/schema-sync/apply");
  const { buildStructuralFingerprint, buildTargetDescriptorHash } =
    await import("@/lib/connectors/schema-sync/identity");
  await applySnapshot({
    workspaceId: target.workspaceId,
    connectionId: target.connectionId,
    sourceEpoch,
    epochBumped: false,
    syncId,
    targetHash: buildTargetDescriptorHash({
      type: "postgres",
      host: FIXTURE.host,
      port: FIXTURE.port,
      database: FIXTURE.database,
      sqliteFileKey: null,
    }),
    snapshot: {
      nameOnlyFallback: true,
      outOfScopeNativeIds: new Set(),
      objects: rows.map((row) =>
        discovery(
          null,
          row.schemaName,
          row.tableName,
          buildStructuralFingerprint([row.tableName]),
        ),
      ),
    },
  });
}
