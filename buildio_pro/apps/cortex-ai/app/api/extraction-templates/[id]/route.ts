import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordDocumentAudit } from "@/lib/audit/document-audit";
import { db } from "@/lib/db";
import { extractionTemplates } from "@/lib/db/schema/extraction-templates";
import { exposeUserExtractionModelChoice } from "@/lib/extraction/model-config";
import { getCurrentUser } from "@/lib/session";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  INSTRUCTIONS_MAX_LENGTH,
  NAME_MAX_LENGTH,
  OUTPUT_SCHEMA_MAX_LENGTH,
} from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

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
    const updates: Partial<typeof extractionTemplates.$inferInsert> = {};
    if (typeof body?.name === "string" && body.name.trim())
      updates.name = body.name.trim();
    if (typeof body?.description === "string")
      updates.description = body.description.trim() || null;
    if (typeof body?.instructions === "string" && body.instructions.trim())
      updates.instructions = body.instructions.trim();
    if ("outputSchema" in (body ?? {}))
      updates.outputSchema = body.outputSchema;
    if (
      exposeUserExtractionModelChoice() &&
      typeof body?.defaultModel === "string"
    )
      updates.defaultModel = body.defaultModel.trim() || null;
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
      {
        label: "Output JSON schema",
        value:
          updates.outputSchema != null
            ? JSON.stringify(updates.outputSchema)
            : null,
        maxLength: OUTPUT_SCHEMA_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json({ error: lengthError }, { status: 400 });

    const [existing] = await db
      .select()
      .from(extractionTemplates)
      .where(
        and(
          eq(extractionTemplates.id, id),
          eq(extractionTemplates.workspaceId, workspace.id),
          isNull(extractionTemplates.deletedAt),
        ),
      )
      .limit(1);
    if (!existing)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    if (updates.name && updates.name !== existing.name) {
      const [duplicate] = await db
        .select({ id: extractionTemplates.id })
        .from(extractionTemplates)
        .where(
          and(
            eq(extractionTemplates.workspaceId, workspace.id),
            eq(extractionTemplates.name, updates.name),
            isNull(extractionTemplates.deletedAt),
            sql`${extractionTemplates.id} <> ${id}`,
          ),
        )
        .limit(1);
      if (duplicate)
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 409 },
        );
    }
    const [template] = await db
      .update(extractionTemplates)
      .set(updates)
      .where(
        and(
          eq(extractionTemplates.id, id),
          eq(extractionTemplates.workspaceId, workspace.id),
          isNull(extractionTemplates.deletedAt),
        ),
      )
      .returning();

    // F6: audit the template update
    void recordDocumentAudit({
      userId: user.id,
      workspaceId: workspace.id,
      action: "template_update",
      templateSnapshot: {
        id: template.id,
        name: template.name,
        instructions: template.instructions,
        outputSchema: template.outputSchema,
        defaultModel: template.defaultModel,
      },
      status: "updated",
    }).catch(console.error);

    return NextResponse.json({
      template: exposeUserExtractionModelChoice()
        ? template
        : { ...template, defaultModel: null },
    });
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
    const [template] = await db
      .update(extractionTemplates)
      .set({ deletedAt: sql`now()` })
      .where(
        and(
          eq(extractionTemplates.id, id),
          eq(extractionTemplates.workspaceId, workspace.id),
          isNull(extractionTemplates.deletedAt),
        ),
      )
      .returning();
    if (!template)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );

    // F6: audit the template soft delete
    void recordDocumentAudit({
      userId: user.id,
      workspaceId: workspace.id,
      action: "template_delete",
      templateSnapshot: {
        id: template.id,
        name: template.name,
        instructions: template.instructions,
        outputSchema: template.outputSchema,
        defaultModel: template.defaultModel,
      },
      status: "deleted",
    }).catch(console.error);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
