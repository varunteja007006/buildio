import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { toolboxes, toolboxTools } from "@/lib/db/schema/toolboxes";
import { getCurrentUser } from "@/lib/session";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  NAME_MAX_LENGTH,
} from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      );
    const { id } = await params;
    const [toolbox] = await db
      .select()
      .from(toolboxes)
      .where(
        and(
          eq(toolboxes.id, id),
          eq(toolboxes.workspaceId, workspace.id),
          isNull(toolboxes.deletedAt),
        ),
      )
      .limit(1);
    if (!toolbox)
      return NextResponse.json({ error: "Toolbox not found" }, { status: 404 });
    const tools = await db
      .select({ toolKey: toolboxTools.toolKey })
      .from(toolboxTools)
      .where(eq(toolboxTools.toolboxId, id));
    return NextResponse.json({
      toolbox,
      toolKeys: tools.map((row) => row.toolKey),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      );
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const updates: Partial<typeof toolboxes.$inferInsert> = {};
    if (typeof body?.name === "string" && body.name.trim())
      updates.name = body.name.trim();
    if (typeof body?.description === "string")
      updates.description = body.description.trim() || null;
    if (!Object.keys(updates).length)
      return NextResponse.json(
        { error: "No valid changes supplied" },
        { status: 400 },
      );
    const lengthError = findTextLengthError([
      { label: "Name", value: updates.name, maxLength: NAME_MAX_LENGTH },
      {
        label: "Description",
        value: updates.description,
        maxLength: DESCRIPTION_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select()
      .from(toolboxes)
      .where(
        and(
          eq(toolboxes.id, id),
          eq(toolboxes.workspaceId, workspace.id),
          isNull(toolboxes.deletedAt),
        ),
      )
      .limit(1);
    if (!existing)
      return NextResponse.json({ error: "Toolbox not found" }, { status: 404 });
    if (updates.name && updates.name !== existing.name) {
      const [duplicate] = await db
        .select({ id: toolboxes.id })
        .from(toolboxes)
        .where(
          and(
            eq(toolboxes.workspaceId, workspace.id),
            eq(toolboxes.name, updates.name),
            isNull(toolboxes.deletedAt),
            sql`${toolboxes.id} <> ${id}`,
          ),
        )
        .limit(1);
      if (duplicate)
        return NextResponse.json(
          { error: "A toolbox with this name already exists" },
          { status: 409 },
        );
    }
    const [toolbox] = await db
      .update(toolboxes)
      .set(updates)
      .where(
        and(
          eq(toolboxes.id, id),
          eq(toolboxes.workspaceId, workspace.id),
          isNull(toolboxes.deletedAt),
        ),
      )
      .returning();
    return NextResponse.json({ toolbox });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      );
    const { id } = await params;
    const [toolbox] = await db
      .update(toolboxes)
      .set({ deletedAt: sql`now()` })
      .where(
        and(
          eq(toolboxes.id, id),
          eq(toolboxes.workspaceId, workspace.id),
          isNull(toolboxes.deletedAt),
        ),
      )
      .returning();
    if (!toolbox)
      return NextResponse.json({ error: "Toolbox not found" }, { status: 404 });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
