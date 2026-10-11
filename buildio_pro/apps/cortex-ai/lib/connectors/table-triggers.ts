import { Client } from "pg";

import { isBlockedHost, type ServerProbeConfig } from "./probe";

const CONNECT_TIMEOUT_MS = 3000;

export type ConnectorTableTrigger = {
  name: string;
  events: string[];
  timing: "BEFORE" | "AFTER" | "INSTEAD OF";
  rowLevel: boolean;
  enabled: "enabled" | "disabled" | "replica" | "always";
  functionSchema: string;
  functionName: string;
};

/** Metadata-only trigger listing for one table; no table rows are read. */
export async function getPostgresTableTriggers(
  config: ServerProbeConfig,
  schema: string,
  name: string,
): Promise<ConnectorTableTrigger[]> {
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
    const result = await client.query<{
      name: string;
      events: string[];
      timing: ConnectorTableTrigger["timing"];
      rowLevel: boolean;
      enabled: ConnectorTableTrigger["enabled"];
      functionSchema: string;
      functionName: string;
    }>(
      `SELECT t.tgname AS name,
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
        WHERE NOT t.tgisinternal AND n.nspname = $1 AND c.relname = $2
        ORDER BY t.tgname`,
      [schema, name],
    );
    return result.rows;
  } finally {
    await client.end().catch(() => undefined);
  }
}
