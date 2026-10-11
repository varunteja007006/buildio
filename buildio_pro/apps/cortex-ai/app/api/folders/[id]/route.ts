import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema/folders";
import { softDeleteFolderCascade } from "@/lib/documents/container-cascade";
import { getCurrentUser } from "@/lib/session";
import { NAME_MAX_LENGTH } from "@/lib/text-limits";
import { getWorkspaceMembership } from "@/lib/workspaces";

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

    const { id } = await params;

    const [existing] = await db
      .select({ workspaceId: folders.workspaceId })
      .from(folders)
      .where(eq(folders.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 },
      );
    }

    const membership = await getWorkspaceMembership(
      user.id,
      existing.workspaceId,
    );
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Folder name is required" },
        { status: 400 },
      );
    }
    if (name.length > NAME_MAX_LENGTH)
      return NextResponse.json(
        {
          success: false,
          error: `Folder name must be at most ${NAME_MAX_LENGTH} characters`,
        },
        { status: 400 },
      );

    const [folder] = await db
      .update(folders)
      .set({ name })
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
      .returning();

    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ folder });
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

    const { id } = await params;

    const [existing] = await db
      .select({ workspaceId: folders.workspaceId })
      .from(folders)
      .where(eq(folders.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 },
      );
    }

    const membership = await getWorkspaceMembership(
      user.id,
      existing.workspaceId,
    );
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 },
      );
    }

    // H11: soft-delete the folder subtree and every document inside it,
    // tagged with one deletedBatchId so restore can undo exactly that batch
    await db.transaction(async (tx) => softDeleteFolderCascade(tx, id));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
