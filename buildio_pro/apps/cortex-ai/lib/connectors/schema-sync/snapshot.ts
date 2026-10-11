import { UUID, MongoClient } from "mongodb";
import { Client } from "pg";

import { buildMongoUri, isBlockedHost, type ServerProbeConfig } from "../probe";
import {
  buildStructuralFingerprint,
  type DiscoveryRecord,
} from "./identity";

const CONNECT_TIMEOUT_MS = 3000;
const STATEMENT_TIMEOUT_MS = 5000;
const MAX_OBJECTS = 500;
const MAX_FINGERPRINT_ROWS = 20000;

export type SchemaSnapshot = {
  objects: DiscoveryRecord[];
  /**
   * True when the source could not expose native object IDs (restricted
   * metadata privileges). Under this fallback, continuity is best-effort by
   * name and missing objects become needs-review, never proven removals.
   */
  nameOnlyFallback: boolean;
  /**
   * Native IDs that still exist in the source but were not part of the
   * discovery scope (Postgres only). They must become needs-review, not
   * removed, because exclusion from scope is not proof of deletion.
   */
  outOfScopeNativeIds: Set<string>;
};

export class SnapshotLimitError extends Error {}
export class SnapshotTimeoutError extends Error {}

function assertBounded(count: number, limit: number, message: string) {
  if (count > limit) throw new SnapshotLimitError(message);
}

type PostgresRelationRow = {
  source_object_id: string;
  schema_name: string;
  table_name: string;
  object_type: DiscoveryRecord["objectType"];
  database_comment: string | null;
};

type PostgresColumnRow = {
  source_object_id: string;
  column_name: string;
  column_type: string;
  not_null: boolean;
};

/**
 * Build a complete Postgres discovery snapshot using the same scope as the
 * existing browsing/generation discovery (only pg_toast excluded), so
 * intentionally browsable objects are never "missing" from a refresh.
 */
export async function buildPostgresSnapshot(
  config: ServerProbeConfig,
  existingNativeIds: string[],
): Promise<SchemaSnapshot> {
  if (isBlockedHost(config.host)) throw new Error("This host is not allowed");
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    statement_timeout: STATEMENT_TIMEOUT_MS,
  });
  try {
    await client.connect();
    const relations = await client.query<PostgresRelationRow>(`
      SELECT c.oid::text AS "source_object_id", n.nspname AS "schema_name",
        c.relname AS "table_name",
        CASE c.relkind
          WHEN 'r' THEN 'table'
          WHEN 'p' THEN 'partitioned_table'
          WHEN 'v' THEN 'view'
          WHEN 'm' THEN 'materialized_view'
          WHEN 'f' THEN 'foreign_table'
        END AS "object_type",
        obj_description(c.oid) AS "database_comment"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
        AND n.nspname NOT LIKE 'pg_toast%'
      ORDER BY n.nspname, c.relname
      LIMIT ${MAX_OBJECTS + 1}`);
    assertBounded(
      relations.rows.length,
      MAX_OBJECTS,
      "Connector schema exceeds the 500-object limit",
    );

    const columns = await client.query<PostgresColumnRow>(`
      SELECT c.oid::text AS "source_object_id", a.attname AS "column_name",
        format_type(a.atttypid, a.atttypmod) AS "column_type",
        a.attnotnull AS "not_null"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a
        ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
        AND n.nspname NOT LIKE 'pg_toast%'
      ORDER BY c.oid, a.attnum
      LIMIT ${MAX_FINGERPRINT_ROWS + 1}`);
    assertBounded(
      columns.rows.length,
      MAX_FINGERPRINT_ROWS,
      "Connector schema exceeds the 20,000-column limit",
    );

    const fingerprints = new Map<string, string[]>();
    for (const row of columns.rows) {
      const parts = fingerprints.get(row.source_object_id) ?? [];
      parts.push(`${row.column_name}:${row.column_type}:${row.not_null}`);
      fingerprints.set(row.source_object_id, parts);
    }

    const objects = relations.rows.map((row): DiscoveryRecord => {
      const parts = fingerprints.get(row.source_object_id);
      return {
        sourceObjectId: row.source_object_id,
        schemaName: row.schema_name,
        tableName: row.table_name,
        objectType: row.object_type,
        databaseComment: row.database_comment,
        fingerprint: parts ? buildStructuralFingerprint(parts) : null,
      };
    });

    // Proven-deletion check: an app-known native ID absent from the snapshot
    // scope is only a proven removal if pg_class no longer contains that OID.
    const scopedIds = new Set(objects.map((object) => object.sourceObjectId));
    const missingIds = existingNativeIds.filter((id) => !scopedIds.has(id));
    const outOfScopeNativeIds = new Set<string>();
    if (missingIds.length > 0) {
      const stillThere = await client.query<{ source_object_id: string }>(
        `SELECT oid::text AS "source_object_id" FROM pg_class
         WHERE oid::text = ANY($1::text[])`,
        [missingIds],
      );
      for (const row of stillThere.rows)
        outOfScopeNativeIds.add(row.source_object_id);
    }

    return { objects, nameOnlyFallback: false, outOfScopeNativeIds };
  } catch (error) {
    if (error instanceof Error && error.message.includes("statement timeout"))
      throw new SnapshotTimeoutError("Schema refresh timed out");
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function collectionUuid(value: unknown): string | null {
  if (value instanceof UUID) return value.toHexString();
  return null;
}

/**
 * Build a MongoDB discovery snapshot. Prefers full metadata (collection
 * UUIDs); falls back to name-only listing when privileges are restricted.
 */
export async function buildMongoSnapshot(
  config: ServerProbeConfig,
): Promise<SchemaSnapshot> {
  if (isBlockedHost(config.host)) throw new Error("This host is not allowed");
  const client = new MongoClient(buildMongoUri(config), {
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    socketTimeoutMS: CONNECT_TIMEOUT_MS,
  });
  try {
    await client.connect();
    const database = client.db(config.database);
    let docs: { name: string; info?: { uuid?: unknown } }[];
    let nameOnlyFallback = false;
    try {
      docs = await database
        .listCollections({}, { nameOnly: false, authorizedCollections: true })
        .maxTimeMS(STATEMENT_TIMEOUT_MS)
        .toArray();
    } catch {
      // Restricted metadata privileges: retry name-only, mark the fallback.
      docs = await database
        .listCollections({}, { nameOnly: true, authorizedCollections: true })
        .maxTimeMS(STATEMENT_TIMEOUT_MS)
        .toArray();
      nameOnlyFallback = true;
    }
    assertBounded(
      docs.length,
      MAX_OBJECTS,
      "Connector schema exceeds the 500-object limit",
    );
    const objects = docs
      .map((doc): DiscoveryRecord => {
        const uuid = collectionUuid(doc.info?.uuid);
        return {
          sourceObjectId: uuid,
          schemaName: config.database,
          tableName: doc.name,
          objectType: "collection",
          databaseComment: null,
          fingerprint: null,
        };
      })
      .sort((a, b) => a.tableName.localeCompare(b.tableName));
    return { objects, nameOnlyFallback, outOfScopeNativeIds: new Set() };
  } finally {
    await client.close().catch(() => undefined);
  }
}
