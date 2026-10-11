import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema/workspace-members";
import { workspaces } from "@/lib/db/schema/workspaces";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  NAME_MAX_LENGTH,
} from "@/lib/text-limits";
import { getWorkspace, getWorkspaceMembership } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const membership = await getWorkspaceMembership(user.id, id);
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 },
      );
    }

    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      workspace: {
        ...workspace,
        role: membership.role,
        isActive: membership.isActive,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

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

    const membership = await getWorkspaceMembership(user.id, id);
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 },
      );
    }

    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const newName = typeof body?.name === "string" ? body.name.trim() : "";
    const newDescription =
      body && "description" in body
        ? typeof body.description === "string"
          ? body.description.trim()
          : null
        : undefined;

    if (!newName) {
      return NextResponse.json(
        { success: false, error: "Workspace name is required" },
        { status: 400 },
      );
    }
    const lengthError = findTextLengthError([
      { label: "Workspace name", value: newName, maxLength: NAME_MAX_LENGTH },
      {
        label: "Description",
        value: newDescription,
        maxLength: DESCRIPTION_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json(
        { success: false, error: lengthError },
        { status: 400 },
      );

    const slug = slugify(newName);
    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace name must contain letters or numbers",
        },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(workspaces)
      .set({
        name: newName,
        slug,
        description:
          newDescription === undefined ? workspace.description : newDescription,
      })
      .where(and(eq(workspaces.id, id), isNull(workspaces.deletedAt)))
      .returning();

    return NextResponse.json({
      workspace: {
        ...updated,
        role: membership.role,
        isActive: membership.isActive,
      },
    });
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

    const membership = await getWorkspaceMembership(user.id, id);
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 },
      );
    }

    if (membership.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Only the workspace owner can delete it" },
        { status: 403 },
      );
    }

    const [deleted] = await db
      .update(workspaces)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(workspaces.id, id), isNull(workspaces.deletedAt)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 },
      );
    }

    // Deactivate all memberships so users are not left with a deleted active workspace
    await db
      .update(workspaceMembers)
      .set({ isActive: false })
      .where(eq(workspaceMembers.workspaceId, id));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
