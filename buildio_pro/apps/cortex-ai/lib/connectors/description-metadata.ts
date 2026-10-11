import { and, eq, isNull } from "drizzle-orm";
import { Client } from "pg";

import { decryptSecret } from "@/lib/connectors/crypto";
import { isLikelySensitiveColumn } from "@/lib/connectors/description-safety";
import { isBlockedHost, type ServerProbeConfig } from "@/lib/connectors/probe";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";

const CONNECT_TIMEOUT_MS = 3000;
const STATEMENT_TIMEOUT_MS = 5000;
const MAX_TABLES = 200;
const MAX_COLUMNS = 3000;

export type ConnectorMetadata = {
  database: string;
  tables: {
    schema: string;
    name: string;
    comment: string | null;
    /** Saved app-DB explanation for active tables; null when none exists. */
    explanation?: string | null;
    columns: {
      name: string;
      type: string;
      nullable: boolean;
      primaryKey: boolean;
      comment: string | null;
    }[];
    relationships: {
      column: string;
      referencedSchema: string;
      referencedTable: string;
      referencedColumn: string;
    }[];
  }[];
};

export async function getPostgresConnector(
  connectionId: string,
  workspaceId: string,
): Promise<ServerProbeConfig> {  const [row] = await db
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        eq(connections.workspaceId, workspaceId),
        eq(connections.type, "postgres"),
        eq(connections.status, "connected"),
        isNull(connections.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Connected Postgres connector not found");
  if (isBlockedHost(row.host ?? ""))
    throw new Error("Connector host is not allowed");

  return {
    type: "postgres",
    host: row.host ?? "",
    port: row.port ?? 5432,
    database: row.database ?? "",
    username: row.username ?? "",
    password: row.passwordEncrypted ? decryptSecret(row.passwordEncrypted) : "",
  };
}

export async function inspectPostgresMetadata(
  config: ServerProbeConfig,
): Promise<ConnectorMetadata> {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  try {
    await client.connect();
    await client.query(`SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    const result = await client.query<{
      schema_name: string;
      table_name: string;
      table_comment: string | null;
      column_name: string;
      data_type: string;
      is_nullable: string;
      is_primary_key: boolean;
      column_comment: string | null;
    }>(`
      SELECT c.table_schema AS schema_name, c.table_name,
        obj_description(format('%I.%I', c.table_schema, c.table_name)::regclass) AS table_comment,
        c.column_name, c.data_type, c.is_nullable,
        EXISTS (
          SELECT 1 FROM information_schema.key_column_usage k
          JOIN information_schema.table_constraints tc
            ON tc.constraint_catalog = k.constraint_catalog
            AND tc.constraint_schema = k.constraint_schema
            AND tc.constraint_name = k.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND k.table_schema = c.table_schema AND k.table_name = c.table_name
            AND k.column_name = c.column_name
        ) AS is_primary_key,
        col_description(format('%I.%I', c.table_schema, c.table_name)::regclass,
          c.ordinal_position) AS column_comment
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE t.table_type = 'BASE TABLE'
        AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY c.table_schema, c.table_name, c.ordinal_position
      LIMIT ${MAX_COLUMNS + 1}
    `);
    if (result.rows.length > MAX_COLUMNS)
      throw new Error("Connector schema exceeds the 3,000-column limit");

    const tables = new Map<string, ConnectorMetadata["tables"][number]>();
    for (const row of result.rows) {
      const key = `${row.schema_name}\0${row.table_name}`;
      let table = tables.get(key);
      if (!table) {
        if (tables.size >= MAX_TABLES)
          throw new Error("Connector schema exceeds the 200-table limit");
        table = {
          schema: row.schema_name,
          name: row.table_name,
          comment: row.table_comment,
          columns: [],
          relationships: [],
        };
        tables.set(key, table);
      }
      table.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        primaryKey: row.is_primary_key,
        comment: row.column_comment,
      });
    }

    const relationships = await client.query<{
      schema_name: string;
      table_name: string;
      column_name: string;
      referenced_schema: string;
      referenced_table: string;
      referenced_column: string;
    }>(`
      SELECT k.table_schema AS schema_name, k.table_name, k.column_name,
        k2.table_schema AS referenced_schema, k2.table_name AS referenced_table,
        k2.column_name AS referenced_column
      FROM information_schema.key_column_usage k
      JOIN information_schema.referential_constraints r
        ON r.constraint_catalog = k.constraint_catalog
        AND r.constraint_schema = k.constraint_schema
        AND r.constraint_name = k.constraint_name
      JOIN information_schema.key_column_usage k2
        ON k2.constraint_catalog = r.unique_constraint_catalog
        AND k2.constraint_schema = r.unique_constraint_schema
        AND k2.constraint_name = r.unique_constraint_name
        AND k2.ordinal_position = k.position_in_unique_constraint
      WHERE k.table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY k.table_schema, k.table_name, k.constraint_name, k.ordinal_position
      LIMIT ${MAX_COLUMNS + 1}
    `);
    if (relationships.rows.length > MAX_COLUMNS)
      throw new Error("Connector schema exceeds the 3,000-relationship limit");
    for (const row of relationships.rows) {
      const table = tables.get(`${row.schema_name}\0${row.table_name}`);
      table?.relationships.push({
        column: row.column_name,
        referencedSchema: row.referenced_schema,
        referencedTable: row.referenced_table,
        referencedColumn: row.referenced_column,
      });
    }

    return { database: config.database, tables: [...tables.values()] };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function quotePostgresIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export type SampleSelection = {
  schema: string;
  table: string;
  columns: string[];
};

export async function samplePostgresRows(
  config: ServerProbeConfig,
  selection: SampleSelection,
  signal?: AbortSignal,
) {
  if (selection.columns.length === 0 || selection.columns.length > 20)
    throw new Error("Select between 1 and 20 columns per sample");
  if (selection.columns.some(isLikelySensitiveColumn))
    throw new Error("Likely sensitive columns cannot be sampled");
  if (signal?.aborted) throw new Error("Generation cancelled");

  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  const closeOnAbort = () => void client.end().catch(() => undefined);
  signal?.addEventListener("abort", closeOnAbort, { once: true });
  try {
    if (signal?.aborted) throw new Error("Generation cancelled");
    await client.connect();
    if (signal?.aborted) throw new Error("Generation cancelled");
    await client.query("BEGIN READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    const columns = selection.columns.map(quotePostgresIdentifier).join(", ");
    const table = `${quotePostgresIdentifier(selection.schema)}.${quotePostgresIdentifier(selection.table)}`;
    const { rows } = await client.query(
      `SELECT ${columns} FROM ${table} LIMIT 5`,
    );
    await client.query("COMMIT");
    return rows;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    signal?.removeEventListener("abort", closeOnAbort);
    await client.end().catch(() => undefined);
  }
}
