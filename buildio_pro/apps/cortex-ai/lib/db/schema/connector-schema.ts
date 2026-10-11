import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { connections } from "./connections";
import { workspaces } from "./workspaces";

/**
 * Source epoch on the connection. Advances when the connector target changes
 * (different type/host/port/database/file) or when a user declares a restore
 * or replacement. Credential-only edits do not reset identity by themselves.
 */
export const connectionEpochColumns = {
  sourceEpoch: integer("source_epoch").notNull().default(1),
};

/**
 * One immutable record per refresh attempt. Sync history is append-only after
 * completion: rows are never updated or deleted by later refreshes.
 */
export const connectorSchemaSyncs = pgTable(
  "connector_schema_syncs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    sourceEpoch: integer("source_epoch").notNull(),
    status: text("status").notNull().default("running"), // running | succeeded | failed
    /** Target descriptor hash observed at sync start (target-change detection). */
    targetHash: text("target_hash"),
    tableCount: integer("table_count").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    // Per-connector sync lock: at most one running refresh at a time.
    runningLockIdx: uniqueIndex("connector_schema_syncs_running_idx")
      .on(table.connectionId)
      .where(sql`${table.status} = 'running'`),
    historyIdx: index("connector_schema_syncs_history_idx").on(
      table.workspaceId,
      table.connectionId,
      table.startedAt,
    ),
  }),
);

/**
 * Discovered source objects. Identity is the app ID; native source IDs are
 * scoped to connection + epoch and are nullable for name-only sources.
 * Explanations live one-to-one in connector_table_contexts and survive
 * renames because reconciliation updates names in place, keyed by native ID.
 */
export const connectorTables = pgTable(
  "connector_tables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    sourceEpoch: integer("source_epoch").notNull(),
    /** Postgres pg_class.oid or MongoDB collection UUID; null = name-only. */
    sourceObjectId: text("source_object_id"),
    schemaName: text("schema_name").notNull(),
    tableName: text("table_name").notNull(),
    objectType: text("object_type").notNull(),
    databaseComment: text("database_comment"),
    fingerprint: text("fingerprint"),
    status: text("status").notNull().default("active"), // active | removed | needs-review
    reviewReason: text("review_reason"),
    lastSeenSyncId: text("last_seen_sync_id").references(
      () => connectorSchemaSyncs.id,
      { onDelete: "set null" },
    ),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  },
  (table) => ({
    // Active-only identities so historical/removed rows never block name
    // reuse or replacement objects within the same epoch.
    nameIdentityIdx: uniqueIndex("connector_tables_name_identity_idx")
      .on(table.connectionId, table.sourceEpoch, table.schemaName, table.tableName)
      .where(sql`${table.status} = 'active'`),
    nativeIdentityIdx: uniqueIndex("connector_tables_native_identity_idx")
      .on(table.connectionId, table.sourceEpoch, table.sourceObjectId)
      .where(
        sql`${table.status} = 'active' AND ${table.sourceObjectId} IS NOT NULL`,
      ),
    listingIdx: index("connector_tables_listing_idx").on(
      table.workspaceId,
      table.connectionId,
      table.status,
    ),
  }),
);

/**
 * Human-authored explanations for individual tables. One-to-one with
 * connector_tables; clearing an explanation updates this row, never the
 * discovered database comment. New/disputed objects remain unusable by
 * execution tools regardless of this record.
 */
export const connectorTableContexts = pgTable(
  "connector_table_contexts",
  {
    tableId: text("table_id")
      .primaryKey()
      .references(() => connectorTables.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    explanation: text("explanation"),
    revision: integer("revision").notNull().default(1),
    editedBy: text("edited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  },
  (table) => ({
    listingIdx: index("connector_table_contexts_listing_idx").on(
      table.workspaceId,
      table.connectionId,
    ),
  }),
);
