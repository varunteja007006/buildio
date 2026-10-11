import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { tableContextInputSchema } from "@/api/connections/schema-contracts";
import { authorizeConnectorTable } from "@/lib/connectors/schema-sync/authorize";
import { db } from "@/lib/db";
import { connectorTableContexts } from "@/lib/db/schema/connector-schema";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string; tableId: string }> };

class RevisionConflict extends Error {}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = tableContextInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  const explanation = parsed.data.explanation.trim() || null;
  const { expectedRevision } = parsed.data;

  const { id, tableId } = await params;
  const resolution = await authorizeConnectorTable(workspace.id, id, tableId);
  if (!resolution.ok)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { table } = resolution;

  try {
    const revision = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(connectorTableContexts)
        .where(eq(connectorTableContexts.tableId, table.id))
        .for("update")
        .limit(1);
      if (!existing) {
        if (expectedRevision !== 0) throw new RevisionConflict();
        const [created] = await tx
          .insert(connectorTableContexts)
          .values({
            tableId: table.id,
            workspaceId: workspace.id,
            connectionId: table.connectionId,
            explanation,
            revision: 1,
            editedBy: user.id,
          })
          .returning({ revision: connectorTableContexts.revision });
        return created.revision;
      }
      if (existing.revision !== expectedRevision) throw new RevisionConflict();
      const [updated] = await tx
        .update(connectorTableContexts)
        .set({
          explanation,
          revision: existing.revision + 1,
          editedBy: user.id,
        })
        .where(eq(connectorTableContexts.tableId, table.id))
        .returning({ revision: connectorTableContexts.revision });
      return updated.revision;
    });
    return NextResponse.json({ success: true, revision });
  } catch (error) {
    if (error instanceof RevisionConflict)
      return NextResponse.json(
        {
          error: "This explanation changed elsewhere; review and retry",
          code: "revision_conflict",
        },
        { status: 409 },
      );
    throw error;
  }
}
