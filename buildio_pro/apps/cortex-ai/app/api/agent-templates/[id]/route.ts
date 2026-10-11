import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { agentInstructionTemplates } from "@/lib/db/schema/agent-templates";
import { getCurrentUser } from "@/lib/session";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  INSTRUCTIONS_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

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
    const updates: Partial<typeof agentInstructionTemplates.$inferInsert> = {};
    if (typeof body?.name === "string" && body.name.trim())
      updates.name = body.name.trim();
    if (typeof body?.description === "string")
      updates.description = body.description.trim() || null;
    if (typeof body?.body === "string" && body.body.trim())
      updates.body = body.body.trim();
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
      { label: "Body", value: updates.body, maxLength: INSTRUCTIONS_MAX_LENGTH },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select()
      .from(agentInstructionTemplates)
      .where(
        and(
          eq(agentInstructionTemplates.id, id),
          eq(agentInstructionTemplates.workspaceId, workspace.id),
          isNull(agentInstructionTemplates.deletedAt),
        ),
      )
      .limit(1);
    if (!existing)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    if (updates.name && updates.name !== existing.name) {
      const [duplicate] = await db
        .select({ id: agentInstructionTemplates.id })
        .from(agentInstructionTemplates)
        .where(
          and(
            eq(agentInstructionTemplates.workspaceId, workspace.id),
            eq(agentInstructionTemplates.name, updates.name),
            isNull(agentInstructionTemplates.deletedAt),
            sql`${agentInstructionTemplates.id} <> ${id}`,
          ),
        )
        .limit(1);
      if (duplicate)
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 409 },
        );
    }
    const [template] = await db
      .update(agentInstructionTemplates)
      .set(updates)
      .where(
        and(
          eq(agentInstructionTemplates.id, id),
          eq(agentInstructionTemplates.workspaceId, workspace.id),
          isNull(agentInstructionTemplates.deletedAt),
        ),
      )
      .returning();
    return NextResponse.json({ template });
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
    const [template] = await db
      .update(agentInstructionTemplates)
      .set({ deletedAt: sql`now()` })
      .where(
        and(
          eq(agentInstructionTemplates.id, id),
          eq(agentInstructionTemplates.workspaceId, workspace.id),
          isNull(agentInstructionTemplates.deletedAt),
        ),
      )
      .returning();
    if (!template)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
