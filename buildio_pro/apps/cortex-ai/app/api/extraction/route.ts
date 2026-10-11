import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { extractionTemplates } from "@/lib/db/schema/extraction-templates";
import { extractions } from "@/lib/db/schema/extractions";
import { exposeUserExtractionModelChoice } from "@/lib/extraction/model-config";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

const MAX_PAGE_SIZE = 200;

/** List extractions for the workspace, optionally scoped to documents. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json({ extractions: [] });

    const documentIds = request.nextUrl.searchParams
      .getAll("documentId")
      .filter(Boolean);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || MAX_PAGE_SIZE),
    );

    const conditions = [
      eq(documents.workspaceId, workspace.id),
      isNull(extractions.deletedAt),
    ];
    if (documentIds.length) {
      conditions.push(inArray(extractions.documentId, documentIds));
    }

    const rows = await db
      .select({
        id: extractions.id,
        documentId: extractions.documentId,
        status: extractions.status,
        error: extractions.error,
        autoIngest: extractions.autoIngest,
        approved: extractions.approved,
        createdAt: extractions.createdAt,
        updatedAt: extractions.updatedAt,
      })
      .from(extractions)
      .innerJoin(documents, eq(extractions.documentId, documents.id))
      .where(and(...conditions))
      .orderBy(desc(extractions.createdAt))
      .limit(limit);

    return NextResponse.json({ extractions: rows });
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
    const documentIds = Array.isArray(body?.documentIds)
      ? body.documentIds.filter((id: unknown): id is string =>
          typeof id === "string" && id.length > 0,
        )
      : [];
    const templateId =
      typeof body?.templateId === "string" ? body.templateId : "";
    const model =
      typeof body?.model === "string" && body.model.trim()
        ? body.model.trim()
        : null;
    const autoIngest = body?.autoIngest === true;

    if (!documentIds.length || !templateId)
      return NextResponse.json(
        { error: "documentIds and templateId are required" },
        { status: 400 },
      );

    const [template] = await db
      .select()
      .from(extractionTemplates)
      .where(
        and(
          eq(extractionTemplates.id, templateId),
          eq(extractionTemplates.workspaceId, workspace.id),
          isNull(extractionTemplates.deletedAt),
        ),
      )
      .limit(1);
    if (!template)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );

    const workspaceDocuments = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          inArray(documents.id, documentIds),
          eq(documents.workspaceId, workspace.id),
          isNull(documents.deletedAt),
        ),
      );
    const foundIds = new Set(workspaceDocuments.map((d) => d.id));
    const missing = documentIds.filter((id: string) => !foundIds.has(id));
    if (missing.length)
      return NextResponse.json(
        { error: "Some documents were not found in this workspace" },
        { status: 404 },
      );

    const templateSnapshot = {
      id: template.id,
      name: template.name,
      instructions: template.instructions,
      outputSchema: template.outputSchema,
      defaultModel: exposeUserExtractionModelChoice()
        ? template.defaultModel
        : null,
    };
    const rows = await db
      .insert(extractions)
      .values(
        documentIds.map((documentId: string) => ({
          documentId,
          templateId: template.id,
          templateSnapshot,
          model: exposeUserExtractionModelChoice()
            ? model ?? template.defaultModel
            : null,
          provider: null,
          status: "pending" as const,
          autoIngest,
        })),
      )
      .returning();

    return NextResponse.json({ extractions: rows }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
