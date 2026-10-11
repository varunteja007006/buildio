import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordDocumentAudit } from "@/lib/audit/document-audit";
import { db } from "@/lib/db";
import { extractionTemplates } from "@/lib/db/schema/extraction-templates";
import { exposeUserExtractionModelChoice } from "@/lib/extraction/model-config";
import { getCurrentUser } from "@/lib/session";
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
        exposeUserModelChoice: exposeUserExtractionModelChoice(),
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
      eq(extractionTemplates.workspaceId, workspace.id),
      includeDeleted
        ? isNotNull(extractionTemplates.deletedAt)
        : isNull(extractionTemplates.deletedAt),
    );
    const [{ total }] = await db
      .select({ total: count() })
      .from(extractionTemplates)
      .where(where);
    const templates = await db
      .select()
      .from(extractionTemplates)
      .where(where)
      .orderBy(asc(extractionTemplates.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const exposeModelChoice = exposeUserExtractionModelChoice();
    return NextResponse.json({
      templates: exposeModelChoice
        ? templates
        : templates.map((template) => ({ ...template, defaultModel: null })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      exposeUserModelChoice: exposeModelChoice,
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
    const instructions =
      typeof body?.instructions === "string" ? body.instructions.trim() : "";
    const description =
      typeof body?.description === "string"
        ? body.description.trim() || null
        : null;
    const defaultModel =
      exposeUserExtractionModelChoice() &&
      typeof body?.defaultModel === "string"
        ? body.defaultModel.trim() || null
        : null;
    const outputSchema = body?.outputSchema ?? null;

    if (!name || !instructions) {
      return NextResponse.json(
        { error: "Name and instructions are required" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: extractionTemplates.id })
      .from(extractionTemplates)
      .where(
        and(
          eq(extractionTemplates.workspaceId, workspace.id),
          eq(extractionTemplates.name, name),
          isNull(extractionTemplates.deletedAt),
        ),
      )
      .limit(1);
    if (existing)
      return NextResponse.json(
        { error: "A template with this name already exists" },
        { status: 409 },
      );

    const [template] = await db
      .insert(extractionTemplates)
      .values({
        workspaceId: workspace.id,
        name,
        description,
        instructions,
        outputSchema,
        defaultModel,
        createdBy: user.id,
      })
      .returning();

    // F6: audit the template creation
    void recordDocumentAudit({
      userId: user.id,
      workspaceId: workspace.id,
      action: "template_create",
      templateSnapshot: {
        id: template.id,
        name: template.name,
        instructions: template.instructions,
        outputSchema: template.outputSchema,
        defaultModel: template.defaultModel,
      },
      status: "created",
    }).catch(console.error);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
