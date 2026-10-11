import { createHash } from "node:crypto";

/**
 * Source identity and lifecycle rules for connector schema synchronization.
 *
 * These rules are the contract between discovery (bounded snapshot reads) and
 * app-DB persistence. They implement Step 1 of
 * docs/plans/connector-table-explanations-2026-10-11.md.
 *
 * Identity rules
 * --------------
 * - Identity is a stable app table ID (`connector_tables.id`), never a
 *   schema/name string. User explanations reference the app ID.
 * - Postgres identity is `pg_class.oid` (native source object ID), which
 *   survives ordinary renames (`ALTER TABLE ... RENAME`) and schema moves
 *   (`ALTER TABLE ... SET SCHEMA`). The structural fingerprint is drift
 *   evidence for review, never identity: identical structure does not prove
 *   the same object, and different structure does not prove a new object.
 * - MongoDB identity uses the collection UUID when `listCollections` returns
 *   full metadata (no `nameOnly`). Restricted metadata privileges or drivers
 *   that cannot return UUIDs fall back to name-only matching, which is
 *   best-effort continuity, never proof. Disappeared/new names under name-only
 *   matching require explicit relinking rather than automatic matching.
 * - Native IDs are scoped to `connectionId + sourceEpoch`. They are not
 *   globally unique and are not guaranteed to survive restore, drop/recreate,
 *   or transparent source replacement. The same qualified name with a
 *   different native ID is a NEW object, not a rename.
 * - The source epoch advances when the connector target changes (different
 *   type/host/port/database/file) or when a user declares a restore or
 *   replacement. Credential-only edits never reset identity by themselves.
 * - Endpoint/database checks cannot reliably detect every restore, transparent
 *   source replacement, or OID reuse after drop/recreate. Uncertain continuity
 *   must surface as `needs-review`, never as silent inheritance.
 *
 * Lifecycle rules
 * ---------------
 * - `active`: present in the last successful snapshot and not under review.
 * - `removed`: proven or review-confirmed absent; context is retained in a
 *   reachable removed view. Removed objects cannot be used by execution tools.
 * - `needs-review`: identity or visibility is uncertain (for example a failed,
 *   truncated, or permission-reduced snapshot, or a name/ID mismatch). These
 *   objects are unavailable to execution tools until reviewed.
 * - Same name plus a different native ID is a new object, not a rename.
 * - For name-only sources, unchanged names are best-effort continuity, not
 *   proof; disappeared/new names require explicit relinking rather than
 *   automatic matching.
 */

/** Normalized lifecycle status for a discovered source object. */
export type ConnectorTableStatus = "active" | "removed" | "needs-review";

/**
 * A normalized discovery record for one source object in a refresh snapshot.
 *
 * `sourceObjectId` is the native identity when the source exposes one
 * (Postgres `pg_class.oid`, MongoDB collection UUID). `null` means the source
 * (or the account's metadata privileges) only supports name-only matching.
 */
export type DiscoveryRecord = {
  sourceObjectId: string | null;
  schemaName: string;
  tableName: string;
  objectType:
    | "table"
    | "partitioned_table"
    | "view"
    | "materialized_view"
    | "foreign_table"
    | "collection";
  databaseComment: string | null;
  /** Bounded structural fingerprint for drift review; never identity. */
  fingerprint: string | null;
};

/** Fields of a connection that define which source database it targets. */
export type ConnectionTargetFields = {
  type: string;
  host: string | null;
  port: number | null;
  database: string | null;
  sqliteFileKey: string | null;
};

/**
 * Hash the connection's target descriptor. Used for target-change detection:
 * a refresh that observes a different descriptor starts a new epoch. This is
 * deliberately NOT identity evidence for tables — it only detects that the
 * connector was pointed at a different source.
 */
export function buildTargetDescriptorHash(
  target: ConnectionTargetFields,
): string {
  return createHash("sha256")
    .update(
      [
        target.type,
        (target.host ?? "").toLowerCase(),
        target.port ?? "",
        target.database ?? "",
        target.sqliteFileKey ?? "",
      ].join("\u0000"),
    )
    .digest("hex");
}

/**
 * Build a bounded structural fingerprint from ordered structural parts
 * (column names/types/nullability/keys). Deterministic; used only for drift
 * review and rename corroboration, never as identity.
 */
export function buildStructuralFingerprint(parts: string[]): string {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}
