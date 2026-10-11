import "dotenv/config";

import { eq } from "drizzle-orm";

import { refreshConnectorSchema } from "@/lib/connectors/schema-sync/reconcile";
import { db } from "@/lib/db";
import {
  connectorSchemaSyncs,
  connectorTableContexts,
} from "@/lib/db/schema/connector-schema";

import {
  applyFallbackSnapshot,
  check,
  cleanupCheckTarget,
  createCheckTarget,
  passedCount,
  rowsFor,
  type CheckTarget,
} from "./schema-sync-harness";

async function insertExplanation(
  target: CheckTarget,
  tableId: string,
  text: string,
) {
  await db.insert(connectorTableContexts).values({
    tableId,
    workspaceId: target.workspaceId,
    connectionId: target.connectionId,
    explanation: text,
    revision: 1,
  });
}

async function contextFor(tableId: string) {
  const [context] = await db
    .select()
    .from(connectorTableContexts)
    .where(eq(connectorTableContexts.tableId, tableId));
  return context;
}

export async function runReconciliationChecks() {
  const target = await createCheckTarget();
  const { source, workspaceId, connectionId, schemaName } = target;
  const refresh = (declareReplacement?: boolean) =>
    refreshConnectorSchema({ workspaceId, connectionId, declareReplacement });
  const inScope = (schema: string) =>
    schema === schemaName || schema === `${schemaName}_archived`;

  try {
    await source.query(`CREATE SCHEMA ${schemaName}`);
    await source.query(`
      CREATE TABLE ${schemaName}.users (
        id integer PRIMARY KEY, email text NOT NULL, note text
      );
      CREATE TABLE ${schemaName}.orders (
        id integer PRIMARY KEY, user_id integer NOT NULL
      )`);

    // 1. Initial refresh discovers both tables as active.
    const first = await refresh();
    check("initial refresh succeeds", first.status === "succeeded");
    const initialRows = await rowsFor(connectionId);
    const checkRows = initialRows.filter((row) => inScope(row.schemaName));
    check(
      "initial refresh discovers 2 active tables",
      checkRows.length === 2 &&
        checkRows.every((row) => row.status === "active"),
    );
    const usersRow = checkRows.find((row) => row.tableName === "users");
    const ordersRow = checkRows.find((row) => row.tableName === "orders");
    check(
      "native OID identity captured",
      Boolean(usersRow?.sourceObjectId && ordersRow?.sourceObjectId),
    );

    // 2. Explanations saved on both tables (app DB only).
    await insertExplanation(
      target,
      usersRow!.id,
      "Registered users of the product.",
    );
    await insertExplanation(
      target,
      ordersRow!.id,
      "Customer orders; one row per order.",
    );

    // 3. Ordinary rename preserves app ID, context, and active status.
    await source.query(`ALTER TABLE ${schemaName}.users RENAME TO customers`);
    const renameResult = await refresh();
    check("rename refresh succeeds", renameResult.status === "succeeded");
    const afterRename = await rowsFor(connectionId);
    const renamedRow = afterRename.find(
      (row) => row.tableName === "customers" && row.schemaName === schemaName,
    );
    check("rename keeps the same app ID", renamedRow?.id === usersRow!.id);
    check(
      "rename keeps the explanation and active status",
      renamedRow?.status === "active",
    );
    check(
      "rename preserves the explanation text",
      (await contextFor(usersRow!.id))?.explanation ===
        "Registered users of the product.",
    );

    // 4. Schema move preserves identity.
    await source.query(`CREATE SCHEMA ${schemaName}_archived`);
    await source.query(
      `ALTER TABLE ${schemaName}.customers SET SCHEMA ${schemaName}_archived`,
    );
    await refresh();
    const afterMove = await rowsFor(connectionId);
    const movedRow = afterMove.find(
      (row) =>
        row.tableName === "customers" &&
        row.schemaName === `${schemaName}_archived` &&
        row.status === "active",
    );
    check(
      "schema move keeps the same app ID and explanation",
      movedRow?.id === usersRow!.id,
    );

    // 5. Proven drop marks removed but retains context.
    await source.query(`DROP TABLE ${schemaName}.orders`);
    await refresh();
    const afterDrop = await rowsFor(connectionId);
    const droppedRow = afterDrop.find((row) => row.id === ordersRow!.id);
    check(
      "dropped table becomes removed",
      droppedRow?.status === "removed" && droppedRow.removedAt !== null,
    );
    check(
      "dropped table retains recoverable context",
      (await contextFor(ordersRow!.id))?.explanation ===
        "Customer orders; one row per order.",
    );

    // 6. Drop + recreate with the same name is a NEW object: old context is
    // not silently inherited.
    await source.query(`DROP TABLE ${schemaName}_archived.customers`);
    await source.query(
      `CREATE TABLE ${schemaName}.customers (id integer PRIMARY KEY)`,
    );
    await refresh();
    const afterRecreate = await rowsFor(connectionId);
    const oldCustomer = afterRecreate.find((row) => row.id === usersRow!.id);
    const newCustomer = afterRecreate.find(
      (row) =>
        row.tableName === "customers" &&
        row.schemaName === schemaName &&
        row.status === "active" &&
        row.id !== usersRow!.id,
    );
    check(
      "same name after drop/recreate is a new object",
      oldCustomer?.status === "removed" && Boolean(newCustomer),
    );
    check(
      "new object does not inherit the old explanation",
      ((await contextFor(newCustomer!.id))?.explanation ?? null) === null,
    );

    // 7. Declared replacement starts a new epoch and moves old records to
    // needs-review while preserving their context.
    const epochBefore = first.sourceEpoch;
    const replacement = await refresh(true);
    check(
      "declared replacement advances the epoch",
      replacement.sourceEpoch === epochBefore + 1,
    );
    const afterEpoch = await rowsFor(connectionId);
    const epochOld = afterEpoch.find((row) => row.id === newCustomer!.id);
    check(
      "previous-epoch records become needs-review with context kept",
      epochOld?.status === "needs-review" &&
        epochOld.reviewReason === "epoch_changed" &&
        epochOld.removedAt === null,
    );
    const epochActive = afterEpoch.filter(
      (row) =>
        row.sourceEpoch === replacement.sourceEpoch &&
        inScope(row.schemaName) &&
        row.status === "active",
    );
    check(
      "fresh epoch rediscovers the source objects",
      epochActive.some((row) => row.tableName === "customers"),
    );

    // 8. Name-only fallback (identity unavailable): rows with native IDs and
    // no matching native identity become needs-review, never removed.
    const [syncRow] = await db
      .insert(connectorSchemaSyncs)
      .values({
        workspaceId,
        connectionId,
        sourceEpoch: replacement.sourceEpoch,
        status: "running",
      })
      .returning();
    const fallbackRows = await rowsFor(connectionId);
    const activeFallbackEpoch = fallbackRows.filter(
      (row) =>
        row.sourceEpoch === replacement.sourceEpoch &&
        inScope(row.schemaName) &&
        row.status === "active",
    );
    await applyFallbackSnapshot(
      target,
      syncRow.id,
      replacement.sourceEpoch,
      activeFallbackEpoch,
    );
    const afterFallback = await rowsFor(connectionId);
    check(
      "visibility loss under name-only fallback needs review",
      activeFallbackEpoch.every((row) => {
        const current = afterFallback.find(
          (candidate) => candidate.id === row.id,
        );
        return (
          current?.status === "needs-review" &&
          current.reviewReason === "source_identity_unavailable"
        );
      }),
    );
  } finally {
    await cleanupCheckTarget(target);
  }
  return passedCount();
}

runReconciliationChecks()
  .then((count) => {
    console.log(`\n${count} checks passed`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
