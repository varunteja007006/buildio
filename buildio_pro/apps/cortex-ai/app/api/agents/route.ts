import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema/agents";
import { getCurrentUser } from "@/lib/session";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  INSTRUCTIONS_MAX_LENGTH,
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
        agents: [],
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
      eq(agents.workspaceId, workspace.id),
      includeDeleted ? isNotNull(agents.deletedAt) : isNull(agents.deletedAt),
    );
    const [{ total }] = await db
      .select({ total: count() })
      .from(agents)
      .where(where);
    const agentRows = await db
      .select()
      .from(agents)
      .where(where)
      .orderBy(asc(agents.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      agents: agentRows,
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
    const instructions =
      typeof body?.instructions === "string"
        ? body.instructions.trim() || null
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
      {
        label: "Instructions",
        value: instructions,
        maxLength: INSTRUCTIONS_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(
        and(
          eq(agents.workspaceId, workspace.id),
          eq(agents.name, name),
          isNull(agents.deletedAt),
        ),
      )
      .limit(1);
    if (existing)
      return NextResponse.json(
        { error: "An agent with this name already exists" },
        { status: 409 },
      );

    const [agent] = await db
      .insert(agents)
      .values({
        workspaceId: workspace.id,
        name,
        description,
        instructions,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
