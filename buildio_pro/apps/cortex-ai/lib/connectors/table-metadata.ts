import { Client } from "pg";

import { isBlockedHost, type ServerProbeConfig } from "./probe";

export type ConnectorTableMetadata = {
  storage: {
    tableBytes: string;
    indexBytes: string;
    totalBytes: string;
  } | null;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    comment: string | null;
  }[];
  indexes: {
    name: string;
    method: string;
    unique: boolean;
    primary: boolean;
    definition: string;
  }[];
  constraints: {
    name: string;
    type: string;
    definition: string;
  }[];
};

const CONNECT_TIMEOUT_MS = 3000;

export async function getPostgresTableMetadata(
  config: ServerProbeConfig,
  schema: string,
  name: string,
): Promise<ConnectorTableMetadata | null> {
  if (isBlockedHost(config.host)) throw new Error("This host is not allowed");
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    statement_timeout: 8000,
  });

  try {
    await client.connect();
    const relation = await client.query<{
      kind: string;
      tableBytes: string;
      indexBytes: string;
      totalBytes: string;
    }>(
      `WITH RECURSIVE relation_tree(oid, relkind) AS (
         SELECT c.oid, c.relkind FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND c.relname = $2
           AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
         UNION
         SELECT child.oid, child.relkind FROM pg_inherits i
         JOIN relation_tree parent ON parent.oid = i.inhparent
         JOIN pg_class child ON child.oid = i.inhrelid
       ), sizes AS (
         SELECT COALESCE(SUM(pg_relation_size(oid)) FILTER
             (WHERE relkind IN ('r', 'm')), 0)::text AS table_bytes,
           COALESCE(SUM(pg_indexes_size(oid)) FILTER
             (WHERE relkind IN ('r', 'm')), 0)::text AS index_bytes,
           COALESCE(SUM(pg_total_relation_size(oid)) FILTER
             (WHERE relkind IN ('r', 'm')), 0)::text AS total_bytes
         FROM relation_tree
       )
       SELECT c.relkind AS kind, sizes.table_bytes AS "tableBytes",
         sizes.index_bytes AS "indexBytes", sizes.total_bytes AS "totalBytes"
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       CROSS JOIN sizes
       WHERE n.nspname = $1 AND c.relname = $2
         AND c.relkind IN ('r', 'p', 'v', 'm', 'f')`,
      [schema, name],
    );
    const root = relation.rows[0];
    if (!root) return null;

    const [columns, indexes, constraints] = await Promise.all([
      client.query<ConnectorTableMetadata["columns"][number]>(
        `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type,
          NOT a.attnotnull AS nullable,
          pg_get_expr(d.adbin, d.adrelid) AS "defaultValue",
          col_description(a.attrelid, a.attnum) AS comment
        FROM pg_attribute a
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE a.attrelid = (
          SELECT c.oid FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1 AND c.relname = $2
        ) AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum`,
        [schema, name],
      ),
      client.query<ConnectorTableMetadata["indexes"][number]>(
        `SELECT index_class.relname AS name, am.amname AS method,
          i.indisunique AS "unique", i.indisprimary AS "primary",
          pg_get_indexdef(i.indexrelid) AS definition
        FROM pg_index i
        JOIN pg_class table_class ON table_class.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = table_class.relnamespace
        JOIN pg_class index_class ON index_class.oid = i.indexrelid
        JOIN pg_am am ON am.oid = index_class.relam
        WHERE n.nspname = $1 AND table_class.relname = $2
        ORDER BY i.indisprimary DESC, index_class.relname`,
        [schema, name],
      ),
      client.query<ConnectorTableMetadata["constraints"][number]>(
        `SELECT conname AS name,
          CASE contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE'
          END AS "type",
          pg_get_constraintdef(oid, true) AS definition
        FROM pg_constraint
        WHERE conrelid = (
          SELECT c.oid FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1 AND c.relname = $2
        ) AND contype IN ('p', 'f', 'u', 'c', 'x')
        ORDER BY contype, conname`,
        [schema, name],
      ),
    ]);

    return {
      storage:
        root.kind === "r" || root.kind === "p" || root.kind === "m"
          ? {
              tableBytes: root.tableBytes,
              indexBytes: root.indexBytes,
              totalBytes: root.totalBytes,
            }
          : null,
      columns: columns.rows,
      indexes: indexes.rows,
      constraints: constraints.rows,
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}
