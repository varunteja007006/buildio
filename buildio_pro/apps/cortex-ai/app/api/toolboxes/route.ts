import { and, asc, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";
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

const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json({
        toolboxes: [],
        total: 0,
        page: 1,
        pageSize: 20,
        pageCount: 0,
      });

    const page = Math.max(
      1,
      Number(request.nextUrl.searchParams.get("page")) || 1,
    );
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(request.nextUrl.searchParams.get("pageSize")) || 20),
    );
    const includeDeleted =
      request.nextUrl.searchParams.get("status") === "deleted";
    const where = and(
      eq(toolboxes.workspaceId, workspace.id),
      includeDeleted
        ? isNotNull(toolboxes.deletedAt)
        : isNull(toolboxes.deletedAt),
    );
    const [{ total }] = await db
      .select({ total: count() })
      .from(toolboxes)
      .where(where);
    const toolboxRows = await db
      .select()
      .from(toolboxes)
      .where(where)
      .orderBy(asc(toolboxes.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const toolboxIds = toolboxRows.map((row) => row.id);
    const toolRows = toolboxIds.length
      ? await db
          .select({
            toolboxId: toolboxTools.toolboxId,
            toolKey: toolboxTools.toolKey,
          })
          .from(toolboxTools)
          .where(inArray(toolboxTools.toolboxId, toolboxIds))
      : [];
    const toolKeysByToolbox = new Map<string, string[]>();
    for (const row of toolRows) {
      const keys = toolKeysByToolbox.get(row.toolboxId) ?? [];
      keys.push(row.toolKey);
      toolKeysByToolbox.set(row.toolboxId, keys);
    }

    return NextResponse.json({
      toolboxes: toolboxRows.map((row) => ({
        ...row,
        toolKeys: toolKeysByToolbox.get(row.id) ?? [],
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string"
        ? body.description.trim() || null
        : null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const lengthError = findTextLengthError([
      { label: "Name", value: name, maxLength: NAME_MAX_LENGTH },
      {
        label: "Description",
        value: description,
        maxLength: DESCRIPTION_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select({ id: toolboxes.id })
      .from(toolboxes)
      .where(
        and(
          eq(toolboxes.workspaceId, workspace.id),
          eq(toolboxes.name, name),
          isNull(toolboxes.deletedAt),
        ),
      )
      .limit(1);
    if (existing)
      return NextResponse.json(
        { error: "A toolbox with this name already exists" },
        { status: 409 },
      );

    const [toolbox] = await db
      .insert(toolboxes)
      .values({ workspaceId: workspace.id, name, description })
      .returning();

    return NextResponse.json({ toolbox }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
