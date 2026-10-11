import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { decryptSecret } from "@/lib/connectors/crypto";
import { authorizeConnectorTable } from "@/lib/connectors/schema-sync/authorize";
import {
  getPostgresTableMetadata,
  type ConnectorTableMetadata,
} from "@/lib/connectors/table-metadata";
import {
  getPostgresTableTriggers,
  type ConnectorTableTrigger,
} from "@/lib/connectors/table-triggers";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import {
  connectorTableContexts,
  connectorTables,
} from "@/lib/db/schema/connector-schema";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string; tableId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });

  const { id, tableId } = await params;
  const resolution = await authorizeConnectorTable(workspace.id, id, tableId);
  if (!resolution.ok)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { table } = resolution;

  const [context] = await db
    .select({
      explanation: connectorTableContexts.explanation,
      revision: connectorTableContexts.revision,
      editedBy: connectorTableContexts.editedBy,
      updatedAt: connectorTableContexts.updatedAt,
    })
    .from(connectorTableContexts)
    .where(eq(connectorTableContexts.tableId, table.id))
    .limit(1);

  // Live physical details are resolved server-side from the authorized
  // connector; they are display-only and never required for context edits.
  let details: ConnectorTableMetadata | null = null;
  let triggers: ConnectorTableTrigger[] = [];
  if (table.status === "active" && table.objectType !== "collection") {
    const [connection] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .limit(1);
    if (connection && connection.type === "postgres") {
      const config = {
        type: "postgres" as const,
        host: connection.host ?? "",
        port: connection.port ?? 5432,
        database: connection.database ?? "",
        username: connection.username ?? "",
        password: connection.passwordEncrypted
          ? decryptSecret(connection.passwordEncrypted)
          : "",
      };
      try {
        [details, triggers] = await Promise.all([
          getPostgresTableMetadata(config, table.schemaName, table.tableName),
          getPostgresTableTriggers(config, table.schemaName, table.tableName),
        ]);
      } catch {
        details = null;
        triggers = [];
      }
    }
  }

  const [current] = await db
    .select({
      id: connectorTables.id,
      sourceEpoch: connectorTables.sourceEpoch,
      sourceObjectId: connectorTables.sourceObjectId,
      schemaName: connectorTables.schemaName,
      tableName: connectorTables.tableName,
      objectType: connectorTables.objectType,
      databaseComment: connectorTables.databaseComment,
      status: connectorTables.status,
      reviewReason: connectorTables.reviewReason,
      lastSeenAt: connectorTables.lastSeenAt,
      removedAt: connectorTables.removedAt,
    })
    .from(connectorTables)
    .where(eq(connectorTables.id, table.id))
    .limit(1);

  return NextResponse.json({
    table: current,
    context: context ?? null,
    details,
    triggers,
  });
}
