import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import { connectorTables } from "@/lib/db/schema/connector-schema";

export type ConnectorTableRow = typeof connectorTables.$inferSelect;

export type TableResolution =
  | { ok: true; table: ConnectorTableRow }
  | { ok: false; code: "connector_not_found" | "table_not_found" };

/**
 * Resolve a nested table under a workspace-authorized, non-deleted connector.
 * A table id alone never authorizes access: the row must belong to the same
 * workspace and connection.
 */
export async function authorizeConnectorTable(
  workspaceId: string,
  connectionId: string,
  tableId: string,
): Promise<TableResolution> {
  const [connection] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        eq(connections.workspaceId, workspaceId),
        isNull(connections.deletedAt),
      ),
    )
    .limit(1);
  if (!connection) return { ok: false, code: "connector_not_found" };
  const [table] = await db
    .select()
    .from(connectorTables)
    .where(
      and(
        eq(connectorTables.id, tableId),
        eq(connectorTables.connectionId, connectionId),
        eq(connectorTables.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!table) return { ok: false, code: "table_not_found" };
  return { ok: true, table };
}
