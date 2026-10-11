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
import { workspaces } from "./workspaces";

export const connections = pgTable(
  "connections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(), // postgres | mongodb | mysql | sqlite
    host: text("host"),
    port: integer("port"),
    username: text("username"),
    passwordEncrypted: text("password_encrypted"),
    database: text("database"),
    sqliteFileKey: text("sqlite_file_key"),
    sqliteFileName: text("sqlite_file_name"),
    sqliteFileSizeBytes: integer("sqlite_file_size_bytes"),
    status: text("status").notNull().default("unverified"), // unverified | connected | failed
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastError: text("last_error"),
    // Advances when the connector target changes or a restore/replacement is
    // declared; scopes native source identity to connection + epoch.
    sourceEpoch: integer("source_epoch").notNull().default(1),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  },
  (table) => ({
    workspaceIdx: index("connections_workspace_idx").on(table.workspaceId),
    nameIdx: uniqueIndex("connections_workspace_name_idx")
      .on(table.workspaceId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
