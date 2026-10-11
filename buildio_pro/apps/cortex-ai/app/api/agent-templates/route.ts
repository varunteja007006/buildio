import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
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

const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json({
        templates: [],
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
      eq(agentInstructionTemplates.workspaceId, workspace.id),
      includeDeleted
        ? isNotNull(agentInstructionTemplates.deletedAt)
        : isNull(agentInstructionTemplates.deletedAt),
    );
    const [{ total }] = await db
      .select({ total: count() })
      .from(agentInstructionTemplates)
      .where(where);
    const templates = await db
      .select()
      .from(agentInstructionTemplates)
      .where(where)
      .orderBy(asc(agentInstructionTemplates.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      templates,
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
    const bodyText = typeof body?.body === "string" ? body.body.trim() : "";
    const description =
      typeof body?.description === "string"
        ? body.description.trim() || null
        : null;

    if (!name || !bodyText) {
      return NextResponse.json(
        { error: "Name and body are required" },
        { status: 400 },
      );
    }
    const lengthError = findTextLengthError([
      { label: "Name", value: name, maxLength: NAME_MAX_LENGTH },
      {
        label: "Description",
        value: description,
        maxLength: DESCRIPTION_MAX_LENGTH,
      },
      { label: "Body", value: bodyText, maxLength: INSTRUCTIONS_MAX_LENGTH },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select({ id: agentInstructionTemplates.id })
      .from(agentInstructionTemplates)
      .where(
        and(
          eq(agentInstructionTemplates.workspaceId, workspace.id),
          eq(agentInstructionTemplates.name, name),
          isNull(agentInstructionTemplates.deletedAt),
        ),
      )
      .limit(1);
    if (existing)
      return NextResponse.json(
        { error: "A template with this name already exists" },
        { status: 409 },
      );

    const [template] = await db
      .insert(agentInstructionTemplates)
      .values({
        workspaceId: workspace.id,
        name,
        description,
        body: bodyText,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
