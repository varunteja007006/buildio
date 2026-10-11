import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { recordDocumentAudit } from "@/lib/audit/document-audit";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { extractionVersions } from "@/lib/db/schema/extraction-versions";
import { extractions } from "@/lib/db/schema/extractions";
import { exposeUserExtractionModelChoice } from "@/lib/extraction/model-config";
import {
  runExtraction,
  type TemplateSnapshot,
} from "@/lib/extraction/run-extraction";
import { ingestDocument } from "@/lib/ingest/ingest-document";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

/** Run (or re-run) a single extraction job. */
export async function POST(_request: Request, { params }: Params) {
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

    const [row] = await db
      .select({
        extraction: extractions,
        filename: documents.filename,
        filepath: documents.filepath,
      })
      .from(extractions)
      .innerJoin(documents, eq(extractions.documentId, documents.id))
      .where(
        and(
          eq(extractions.id, id),
          eq(documents.workspaceId, workspace.id),
          isNull(extractions.deletedAt),
        ),
      )
      .limit(1);
    if (!row)
      return NextResponse.json(
        { error: "Extraction not found" },
        { status: 404 },
      );

    const { extraction, filename, filepath } = row;
    if (extraction.status === "processing")
      return NextResponse.json(
        { error: "Extraction is already running" },
        { status: 409 },
      );

    const [processing] = await db
      .update(extractions)
      .set({ status: "processing", error: null })
      .where(and(eq(extractions.id, id), isNull(extractions.deletedAt)))
      .returning();

    const startedAt = Date.now();
    console.log(
      `[extraction] start id=${id} model=${processing.model ?? "default"}`,
    );

    const template = (extraction.templateSnapshot ?? {}) as TemplateSnapshot;

    try {
      if (!template.instructions)
        throw new Error("Extraction has no template instructions");

      const result = await runExtraction({
        template,
        filename,
        filepath,
        model: exposeUserExtractionModelChoice() ? processing.model : null,
      });

      const [{ nextVersion }] = await db
        .select({
          nextVersion: sql<number>`coalesce(max(${extractionVersions.version}), 0) + 1`,
        })
        .from(extractionVersions)
        .where(eq(extractionVersions.extractionId, id));

      await db.insert(extractionVersions).values({
        extractionId: id,
        version: nextVersion,
        source: "ai",
        content: result.rawOutput,
        structuredOutput: result.structuredOutput,
        createdBy: user.id,
      });

      const [completed] = await db
        .update(extractions)
        .set({
          status: "completed",
          rawOutput: result.rawOutput,
          currentContent: result.rawOutput,
          structuredOutput: result.structuredOutput,
          model: result.model,
          provider: result.provider,
          usage: result.usage,
          error: result.structuredError,
          // New content supersedes any previous review approval
          approved: false,
        })
        .where(eq(extractions.id, id))
        .returning();

      console.log(
        `[extraction] done id=${id} status=completed in ${(
          (Date.now() - startedAt) / 1000
        ).toFixed(1)}s`,
      );

      // F1: audit the extraction (immutable log — never blocks the response)
      void recordDocumentAudit({
        userId: user.id,
        workspaceId: workspace.id,
        action: "extract",
        documentIds: [extraction.documentId],
        extractionId: id,
        templateSnapshot: extraction.templateSnapshot,
        instructionsSnapshot: template.instructions,
        rawAiOutput: result.rawOutput,
        finalOutput: completed.currentContent,
        model: result.model,
        provider: result.provider,
        usage: result.usage,
        durationMs: Date.now() - startedAt,
        status: "completed",
      }).catch(console.error);

      // E4: auto-ingest when the extraction was queued with the toggle on.
      // A failure here does not fail the (already completed) extraction.
      let ingestion: Awaited<ReturnType<typeof ingestDocument>> | null = null;
      if (extraction.autoIngest) {
        const ingestStartedAt = Date.now();
        let outcome: Awaited<ReturnType<typeof ingestDocument>>;
        try {
          outcome = await ingestDocument(
            { id: extraction.documentId, filename, filepath },
            workspace.id,
          );
        } catch (error) {
          outcome = {
            success: false,
            error:
              error instanceof Error ? error.message : "Unknown ingest error",
          };
        }
        ingestion = outcome;

        // F2: audit the auto-triggered ingestion
        void recordDocumentAudit({
          userId: user.id,
          workspaceId: workspace.id,
          action: "ingest",
          documentIds: [extraction.documentId],
          usage: outcome.success
            ? {
                chunksCount: outcome.chunksCount,
                resourceId: outcome.resourceId,
                source: outcome.source,
                embeddingTokens: outcome.embeddingTokens,
              }
            : null,
          durationMs: Date.now() - ingestStartedAt,
          status: outcome.success ? "completed" : "failed",
          error: outcome.success ? null : outcome.error,
        }).catch(console.error);
      }

      return NextResponse.json({ extraction: completed, ingestion });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown extraction error";
      const [failed] = await db
        .update(extractions)
        .set({ status: "failed", error: message })
        .where(eq(extractions.id, id))
        .returning();

      // F1: audit the failed extraction
      void recordDocumentAudit({
        userId: user.id,
        workspaceId: workspace.id,
        action: "extract",
        documentIds: [extraction.documentId],
        extractionId: id,
        templateSnapshot: extraction.templateSnapshot,
        instructionsSnapshot: template.instructions,
        model: processing.model,
        durationMs: Date.now() - startedAt,
        status: "failed",
        error: message,
      }).catch(console.error);

      console.log(
        `[extraction] done id=${id} status=failed in ${(
          (Date.now() - startedAt) / 1000
        ).toFixed(1)}s error=${message}`,
      );
      return NextResponse.json({ extraction: failed }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
