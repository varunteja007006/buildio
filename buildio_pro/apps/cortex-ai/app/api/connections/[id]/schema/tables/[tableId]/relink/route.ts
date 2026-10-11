import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { tableRelinkInputSchema } from "@/api/connections/schema-contracts";
import { authorizeConnectorTable } from "@/lib/connectors/schema-sync/authorize";
import { db } from "@/lib/db";
import { connectorTableContexts, connectorTables } from "@/lib/db/schema/connector-schema";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string; tableId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = tableRelinkInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  const { destinationTableId } = parsed.data;

  const { id, tableId } = await params;
  if (destinationTableId === tableId)
    return NextResponse.json(
      { error: "Cannot relink a table to itself", code: "invalid_destination" },
      { status: 400 },
    );
  const source = await authorizeConnectorTable(workspace.id, id, tableId);
  if (!source.ok)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (source.table.status === "active")
    return NextResponse.json(
      {
        error: "Only removed or needs-review tables can be relinked",
        code: "source_not_relinkable",
      },
      { status: 409 },
    );

  const [destination] = await db
    .select()
    .from(connectorTables)
    .where(
      and(
        eq(connectorTables.id, destinationTableId),
        eq(connectorTables.connectionId, id),
        eq(connectorTables.workspaceId, workspace.id),
        eq(connectorTables.status, "active"),
      ),
    )
    .limit(1);
  if (!destination)
    return NextResponse.json(
      { error: "Destination table not found or not active", code: "invalid_destination" },
      { status: 404 },
    );

  const [sourceContext] = await db
    .select()
    .from(connectorTableContexts)
    .where(eq(connectorTableContexts.tableId, source.table.id))
    .limit(1);
  if (!sourceContext?.explanation)
    return NextResponse.json(
      { error: "The historical table has no explanation to move", code: "no_explanation" },
      { status: 400 },
    );
  const [destinationContext] = await db
    .select({ explanation: connectorTableContexts.explanation })
    .from(connectorTableContexts)
    .where(eq(connectorTableContexts.tableId, destination.id))
    .limit(1);
  if (destinationContext?.explanation)
    return NextResponse.json(
      {
        error: "The destination already has an explanation; resolve the conflict first",
        code: "destination_context_conflict",
      },
      { status: 409 },
    );

  // Move the explanation only. The historical source record is preserved;
  // execution permissions and policy are never transferred.
  await db.transaction(async (tx) => {
    await tx
      .insert(connectorTableContexts)
      .values({
        tableId: destination.id,
        workspaceId: workspace.id,
        connectionId: destination.connectionId,
        explanation: sourceContext.explanation,
        revision: 1,
        editedBy: user.id,
      })
      .onConflictDoUpdate({
        target: connectorTableContexts.tableId,
        set: {
          explanation: sourceContext.explanation,
          revision: 1,
          editedBy: user.id,
        },
      });
    await tx
      .delete(connectorTableContexts)
      .where(
        and(
          eq(connectorTableContexts.tableId, source.table.id),
          ne(connectorTableContexts.tableId, destination.id),
        ),
      );
  });
  return NextResponse.json({ success: true });
}
