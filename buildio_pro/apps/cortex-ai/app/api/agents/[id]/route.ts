import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { agentTopics, agentTools, agents } from "@/lib/db/schema/agents";
import { toolboxes, toolboxTools } from "@/lib/db/schema/toolboxes";
import { topics } from "@/lib/db/schema/topics";
import { getCurrentUser } from "@/lib/session";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  INSTRUCTIONS_MAX_LENGTH,
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
    const [agent] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.workspaceId, workspace.id),
          isNull(agents.deletedAt),
        ),
      )
      .limit(1);
    if (!agent)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const topicRows = await db
      .select({
        id: topics.id,
        name: topics.name,
        slug: topics.slug,
        description: topics.description,
      })
      .from(agentTopics)
      .innerJoin(topics, eq(agentTopics.topicId, topics.id))
      .where(and(eq(agentTopics.agentId, id), isNull(topics.deletedAt)));

    const toolRows = await db
      .select({ toolKey: agentTools.toolKey, toolboxId: agentTools.toolboxId })
      .from(agentTools)
      .where(eq(agentTools.agentId, id));
    const toolboxIds = toolRows
      .map((row) => row.toolboxId)
      .filter((value): value is string => value !== null);
    const toolKeys = toolRows
      .map((row) => row.toolKey)
      .filter((value): value is string => value !== null);

    const toolboxRows = toolboxIds.length
      ? await db
          .select({
            id: toolboxes.id,
            name: toolboxes.name,
          })
          .from(toolboxes)
          .where(
            and(
              inArray(toolboxes.id, toolboxIds),
              isNull(toolboxes.deletedAt),
            ),
          )
      : [];
    const activeToolboxIds = new Set(toolboxRows.map((row) => row.id));
    const toolboxToolRows = activeToolboxIds.size
      ? await db
          .select({ toolboxId: toolboxTools.toolboxId, toolKey: toolboxTools.toolKey })
          .from(toolboxTools)
          .where(inArray(toolboxTools.toolboxId, [...activeToolboxIds]))
      : [];

    return NextResponse.json({
      agent,
      topics: topicRows,
      tools: toolKeys,
      toolboxes: toolboxRows.map((row) => ({
        id: row.id,
        name: row.name,
        toolKeys: toolboxToolRows
          .filter((entry) => entry.toolboxId === row.id)
          .map((entry) => entry.toolKey),
      })),
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
    const updates: Partial<typeof agents.$inferInsert> = {};
    if (typeof body?.name === "string" && body.name.trim())
      updates.name = body.name.trim();
    if (typeof body?.description === "string")
      updates.description = body.description.trim() || null;
    if (typeof body?.instructions === "string")
      updates.instructions = body.instructions.trim() || null;
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
      {
        label: "Instructions",
        value: updates.instructions,
        maxLength: INSTRUCTIONS_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.workspaceId, workspace.id),
          isNull(agents.deletedAt),
        ),
      )
      .limit(1);
    if (!existing)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (updates.name && updates.name !== existing.name) {
      const [duplicate] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(
          and(
            eq(agents.workspaceId, workspace.id),
            eq(agents.name, updates.name),
            isNull(agents.deletedAt),
            sql`${agents.id} <> ${id}`,
          ),
        )
        .limit(1);
      if (duplicate)
        return NextResponse.json(
          { error: "An agent with this name already exists" },
          { status: 409 },
        );
    }
    const [agent] = await db
      .update(agents)
      .set(updates)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.workspaceId, workspace.id),
          isNull(agents.deletedAt),
        ),
      )
      .returning();
    return NextResponse.json({ agent });
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
    const [agent] = await db
      .update(agents)
      .set({ deletedAt: sql`now()` })
      .where(
        and(
          eq(agents.id, id),
          eq(agents.workspaceId, workspace.id),
          isNull(agents.deletedAt),
        ),
      )
      .returning();
    if (!agent)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
