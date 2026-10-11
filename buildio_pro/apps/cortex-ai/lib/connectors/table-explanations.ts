import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  connectorTableContexts,
  connectorTables,
} from "@/lib/db/schema/connector-schema";

/**
 * Load saved explanations for a connector's active tables, keyed by
 * `schema\0table`. Only active rows are returned: removed and needs-review
 * objects never reach generation context.
 */
export async function loadTableExplanations(
  connectionId: string,
  workspaceId: string,
): Promise<Map<string, string>> {
  const rows = await db
    .select({
      schemaName: connectorTables.schemaName,
      tableName: connectorTables.tableName,
      explanation: connectorTableContexts.explanation,
    })
    .from(connectorTables)
    .innerJoin(
      connectorTableContexts,
      eq(connectorTableContexts.tableId, connectorTables.id),
    )
    .where(
      and(
        eq(connectorTables.connectionId, connectionId),
        eq(connectorTables.workspaceId, workspaceId),
        eq(connectorTables.status, "active"),
      ),
    );
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.explanation)
      map.set(`${row.schemaName}\u0000${row.tableName}`, row.explanation);
  }
  return map;
}
