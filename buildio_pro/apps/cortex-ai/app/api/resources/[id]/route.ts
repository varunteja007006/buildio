import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

/** Fetch a single resource's full content (workspace-scoped). */
export async function GET(_request: Request, { params }: Params) {
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

    const [resource] = await db
      .select({
        id: resources.id,
        content: resources.content,
        createdAt: resources.createdAt,
        updatedAt: resources.updatedAt,
      })
      .from(resources)
      .where(
        and(
          eq(resources.id, id),
          eq(resources.workspaceId, workspace.id),
          isNull(resources.deletedAt),
        ),
      )
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(resource);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

/** Soft-delete a resource so it drops out of RAG retrieval. */
export async function DELETE(_request: Request, { params }: Params) {
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

    const [resource] = await db
      .update(resources)
      .set({ deletedAt: sql`now()` })
      .where(
        and(
          eq(resources.id, id),
          eq(resources.workspaceId, workspace.id),
          isNull(resources.deletedAt),
        ),
      )
      .returning({ id: resources.id });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
