import { and, count, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema/topics";
import { softDeleteTopicCascade } from "@/lib/documents/container-cascade";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { NAME_MAX_LENGTH } from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "No active workspace" },
        { status: 400 },
      );
    }

    const { id } = await params;

    const body = await request.json().catch(() => null);
    const newName = typeof body?.name === "string" ? body.name.trim() : "";

    if (!newName) {
      return NextResponse.json(
        { success: false, error: "Topic name is required" },
        { status: 400 },
      );
    }
    if (newName.length > NAME_MAX_LENGTH)
      return NextResponse.json(
        {
          success: false,
          error: `Topic name must be at most ${NAME_MAX_LENGTH} characters`,
        },
        { status: 400 },
      );

    const slug = slugify(newName);
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Topic name must contain letters or numbers" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(topics)
      .where(
        and(
          eq(topics.id, id),
          eq(topics.workspaceId, workspace.id),
          isNull(topics.deletedAt),
        ),
      );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Topic not found" },
        { status: 404 },
      );
    }

    const [{ slugCount }] = await db
      .select({ slugCount: count() })
      .from(topics)
      .where(
        and(
          eq(topics.workspaceId, workspace.id),
          isNull(topics.deletedAt),
          eq(topics.slug, slug),
          // exclude self
          sql`${topics.id} <> ${id}`,
        ),
      );

    if (slugCount > 0) {
      return NextResponse.json(
        { success: false, error: "A topic with this name already exists" },
        { status: 409 },
      );
    }

    const [topic] = await db
      .update(topics)
      .set({ name: newName, slug })
      .where(
        and(
          eq(topics.id, id),
          eq(topics.workspaceId, workspace.id),
          isNull(topics.deletedAt),
        ),
      )
      .returning();

    return NextResponse.json({ topic });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "No active workspace" },
        { status: 400 },
      );
    }

    const { id } = await params;

    // H11: soft-delete the topic, its folder trees, and all of its
    // documents (with their extractions/resources/embeddings), tagged with
    // one deletedBatchId so restore can undo exactly that batch
    await db.transaction(async (tx) => softDeleteTopicCascade(tx, id));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
