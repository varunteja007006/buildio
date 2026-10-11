import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { CONNECTOR_DESCRIPTION_MAX_LENGTH } from "@/api/connections/schema-contracts";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

const contextSchema = z.object({
  description: z.string().max(CONNECTOR_DESCRIPTION_MAX_LENGTH),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = contextSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );

  const { id } = await params;
  const [connection] = await db
    .update(connections)
    .set({ description: parsed.data.description.trim() || null })
    .where(
      and(
        eq(connections.id, id),
        eq(connections.workspaceId, workspace.id),
        isNull(connections.deletedAt),
      ),
    )
    .returning({ id: connections.id });
  if (!connection)
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 },
    );

  return NextResponse.json({ success: true });
}
