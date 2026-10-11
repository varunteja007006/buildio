import { and, asc, count, eq, isNull, max } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema/folders";
import { topics } from "@/lib/db/schema/topics";
import { getCurrentUser } from "@/lib/session";
import { NAME_MAX_LENGTH } from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

const MAX_ROOT_FOLDERS = 10;
const MAX_CHILDREN = 5;
const MAX_DEPTH = 5;

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ folders: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get("topicId");
    const parentFolderId = searchParams.get("parentFolderId");

    // No topicId → return all folders for the workspace (for building a tree)
    if (!topicId) {
      const allFolders = await db
        .select()
        .from(folders)
        .where(
          and(eq(folders.workspaceId, workspace.id), isNull(folders.deletedAt)),
        )
        .orderBy(
          asc(folders.topicId),
          asc(folders.depth),
          asc(folders.position),
          asc(folders.createdAt),
        );

      return NextResponse.json({ folders: allFolders });
    }

    // Absent param or "root" means top-level folders of the topic
    const parentId =
      parentFolderId && parentFolderId !== "root" ? parentFolderId : null;

    const folderList = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.workspaceId, workspace.id),
          eq(folders.topicId, topicId),
          isNull(folders.deletedAt),
          parentId
            ? eq(folders.parentFolderId, parentId)
            : isNull(folders.parentFolderId),
        ),
      )
      .orderBy(asc(folders.position), asc(folders.createdAt));

    return NextResponse.json({ folders: folderList });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const topicId = typeof body?.topicId === "string" ? body.topicId : "";
    const parentFolderId =
      typeof body?.parentFolderId === "string" ? body.parentFolderId : null;

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

    if (!topicId) {
      return NextResponse.json(
        { success: false, error: "topicId is required" },
        { status: 400 },
      );
    }

    const [topic] = await db
      .select()
      .from(topics)
      .where(
        and(
          eq(topics.id, topicId),
          eq(topics.workspaceId, workspace.id),
          isNull(topics.deletedAt),
        ),
      );

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found" },
        { status: 404 },
      );
    }

    let depth = 0;
    if (parentFolderId) {
      const [parent] = await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, parentFolderId),
            eq(folders.workspaceId, workspace.id),
            isNull(folders.deletedAt),
          ),
        );

      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent folder not found" },
          { status: 404 },
        );
      }

      if (parent.topicId !== topicId) {
        return NextResponse.json(
          {
            success: false,
            error: "Parent folder does not belong to this topic",
          },
          { status: 400 },
        );
      }

      depth = parent.depth + 1;
      if (depth > MAX_DEPTH) {
        return NextResponse.json(
          {
            success: false,
            error: `Folders cannot nest deeper than ${MAX_DEPTH} levels`,
          },
          { status: 409 },
        );
      }
    }

    // Enforce sibling limits: 10 roots per topic, 5 children per folder
    const siblingWhere = and(
      eq(folders.workspaceId, workspace.id),
      eq(folders.topicId, topicId),
      isNull(folders.deletedAt),
      parentFolderId
        ? eq(folders.parentFolderId, parentFolderId)
        : isNull(folders.parentFolderId),
    );

    const [{ siblingCount }] = await db
      .select({ siblingCount: count() })
      .from(folders)
      .where(siblingWhere);

    const limit = parentFolderId ? MAX_CHILDREN : MAX_ROOT_FOLDERS;
    if (siblingCount >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: parentFolderId
            ? `A folder can contain at most ${MAX_CHILDREN} subfolders`
            : `A topic can contain at most ${MAX_ROOT_FOLDERS} root folders`,
        },
        { status: 409 },
      );
    }

    const [{ maxPosition }] = await db
      .select({ maxPosition: max(folders.position) })
      .from(folders)
      .where(siblingWhere);

    const [folder] = await db
      .insert(folders)
      .values({
        workspaceId: workspace.id,
        topicId,
        parentFolderId,
        name,
        depth,
        position: (maxPosition ?? 0) + 1,
      })
      .returning();

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
