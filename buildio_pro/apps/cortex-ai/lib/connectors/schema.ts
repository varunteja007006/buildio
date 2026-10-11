import { MongoClient } from "mongodb";
import { Client } from "pg";

import { buildMongoUri, isBlockedHost, type ServerProbeConfig } from "./probe";

const CONNECT_TIMEOUT_MS = 3000;
const TOTAL_TIMEOUT_MS = 8000;

export type ConnectorTable = {
  schema: string;
  name: string;
  objectType:
    | "table"
    | "partitioned_table"
    | "view"
    | "materialized_view"
    | "foreign_table"
    | "collection";
  triggers: ConnectorTrigger[];
};

export type ConnectorTrigger = {
  name: string;
  events: string[];
  timing: "BEFORE" | "AFTER" | "INSTEAD OF";
  rowLevel: boolean;
  enabled: "enabled" | "disabled" | "replica" | "always";
  functionSchema: string;
  functionName: string;
};

export async function listPostgresTables(
  config: ServerProbeConfig,
): Promise<ConnectorTable[]> {
  if (isBlockedHost(config.host)) throw new Error("This host is not allowed");
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
    const [relations, triggerRows] = await Promise.all([
      client.query<{
        schema: string;
        name: string;
        objectType: ConnectorTable["objectType"];
      }>(`SELECT n.nspname AS schema, c.relname AS name,
          CASE c.relkind
            WHEN 'r' THEN 'table'
            WHEN 'p' THEN 'partitioned_table'
            WHEN 'v' THEN 'view'
            WHEN 'm' THEN 'materialized_view'
            WHEN 'f' THEN 'foreign_table'
          END AS "objectType"
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
          AND n.nspname NOT LIKE 'pg_toast%'
        ORDER BY n.nspname, c.relname`),
      client.query<{
        schema: string;
        tableName: string;
        name: string;
        events: string[];
        timing: ConnectorTrigger["timing"];
        rowLevel: boolean;
        enabled: ConnectorTrigger["enabled"];
        functionSchema: string;
        functionName: string;
      }>(`SELECT n.nspname AS schema, c.relname AS "tableName", t.tgname AS name,
          array_remove(ARRAY[
            CASE WHEN (t.tgtype & 4) <> 0 THEN 'INSERT' END,
            CASE WHEN (t.tgtype & 8) <> 0 THEN 'DELETE' END,
            CASE WHEN (t.tgtype & 16) <> 0 THEN 'UPDATE' END,
            CASE WHEN (t.tgtype & 32) <> 0 THEN 'TRUNCATE' END
          ], NULL) AS events,
          CASE WHEN (t.tgtype & 64) <> 0 THEN 'INSTEAD OF'
            WHEN (t.tgtype & 2) <> 0 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
          (t.tgtype & 1) <> 0 AS "rowLevel",
          CASE t.tgenabled WHEN 'O' THEN 'enabled' WHEN 'D' THEN 'disabled'
            WHEN 'R' THEN 'replica' WHEN 'A' THEN 'always' END AS enabled,
          pn.nspname AS "functionSchema", p.proname AS "functionName"
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace pn ON pn.oid = p.pronamespace
        WHERE NOT t.tgisinternal AND n.nspname NOT LIKE 'pg_toast%'
        ORDER BY n.nspname, c.relname, t.tgname`),
    ]);
    const triggers = new Map<string, ConnectorTrigger[]>();
    for (const row of triggerRows.rows) {
      const key = `${row.schema}\0${row.tableName}`;
      const list = triggers.get(key) ?? [];
      list.push({
        name: row.name,
        events: row.events,
        timing: row.timing,
        rowLevel: row.rowLevel,
        enabled: row.enabled,
        functionSchema: row.functionSchema,
        functionName: row.functionName,
      });
      triggers.set(key, list);
    }
    return relations.rows.map((row) => ({
      ...row,
      triggers: triggers.get(`${row.schema}\0${row.name}`) ?? [],
    }));
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function listMongoCollections(
  config: ServerProbeConfig,
): Promise<ConnectorTable[]> {
  if (isBlockedHost(config.host)) throw new Error("This host is not allowed");
  const client = new MongoClient(buildMongoUri(config), {
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    socketTimeoutMS: CONNECT_TIMEOUT_MS,
  });
  try {
    await client.connect();
    const collections = await client
      .db(config.database)
      .listCollections({}, { nameOnly: true })
      .toArray();
    return collections
      .map((collection) => collection.name)
      .sort()
      .map((name) => ({
        schema: config.database,
        name,
        objectType: "collection" as const,
        triggers: [],
      }));
  } finally {
    await client.close().catch(() => undefined);
  }
}

export async function listConnectionTables(
  config: ServerProbeConfig,
): Promise<ConnectorTable[]> {
  return Promise.race([
    config.type === "mongodb"
      ? listMongoCollections(config)
      : listPostgresTables(config),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Listing tables timed out")),
        TOTAL_TIMEOUT_MS,
      ),
    ),
  ]);
}
