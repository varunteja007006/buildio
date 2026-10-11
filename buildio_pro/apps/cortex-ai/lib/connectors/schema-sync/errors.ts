/** Error codes shared by the schema refresh route and sync reconciliation. */
export type SyncErrorCode =
  | "connector_not_found"
  | "connector_not_connected"
  | "unsupported_connector_type"
  | "refresh_already_running"
  | "refresh_cooldown"
  | "snapshot_failed"
  | "limit_exceeded"
  | "timeout"
  | "target_changed_during_refresh"
  | "apply_failed";

/** Client-safe messages: never leak credentials or stack details. */
export const SANITIZED_MESSAGES: Record<SyncErrorCode, string> = {
  connector_not_found: "Connector not found",
  connector_not_connected: "Connector must be connected before a refresh",
  unsupported_connector_type: "This connector type cannot be synchronized",
  refresh_already_running: "A schema refresh is already running",
  refresh_cooldown:
    "A schema refresh just completed; wait a moment before refreshing again",
  snapshot_failed: "Schema refresh failed; the last snapshot is preserved",
  limit_exceeded: "Connector schema exceeds the synchronization limit",
  timeout: "Schema refresh timed out",
  target_changed_during_refresh:
    "The connector changed during the refresh; nothing was committed",
  apply_failed: "Schema refresh could not be recorded; nothing was committed",
};

const HTTP_STATUS: Record<SyncErrorCode, number> = {
  connector_not_found: 404,
  connector_not_connected: 409,
  unsupported_connector_type: 400,
  refresh_already_running: 409,
  refresh_cooldown: 429,
  snapshot_failed: 502,
  limit_exceeded: 413,
  timeout: 504,
  target_changed_during_refresh: 409,
  apply_failed: 500,
};

export function refreshErrorStatus(code: SyncErrorCode): number {
  return HTTP_STATUS[code];
}
