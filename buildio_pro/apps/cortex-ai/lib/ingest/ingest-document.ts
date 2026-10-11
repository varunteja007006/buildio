import path from "node:path";

import { and, desc, eq, isNull } from "drizzle-orm";

import { generateChunks, generateEmbeddings } from "@/lib/ai/embedding";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { embeddings } from "@/lib/db/schema/embeddings";
import { extractions } from "@/lib/db/schema/extractions";
import { resources } from "@/lib/db/schema/resources";
import { getDocumentObject } from "@/lib/storage/s3";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".mdx", ".csv"]);

export type IngestDocumentOutcome =
  | {
      success: true;
      chunksCount: number;
      resourceId: string;
      source: "extraction" | "file";
      /** Embedding tokens reported by the provider, when available. */
      embeddingTokens: number | null;
    }
  | { success: false; error: string };

/**
 * Ingest a single document and persist the outcome's error state on the
 * document row (`lastIngestError`, cleared on success) so failures stay
 * visible in the UI.
 */
export async function ingestDocument(
  document: { id: string; filename: string; filepath: string },
  workspaceId: string,
): Promise<IngestDocumentOutcome> {
  // Unexpected throws (bugs, provider failures) are converted into a
  // failed outcome so `lastIngestError` always reflects the latest attempt.
  let outcome: IngestDocumentOutcome;
  try {
    outcome = await runIngest(document, workspaceId);
  } catch (error) {
    outcome = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown ingest error",
    };
  }
  await db
    .update(documents)
    .set({ lastIngestError: outcome.success ? null : outcome.error })
    .where(eq(documents.id, document.id));
  return outcome;
}

/**
 * Chunk + embed a document's content and store a resource.
 *
 * Content resolution (E2): the latest approved completed extraction's
 * `currentContent` wins; otherwise fall back to the raw uploaded file
 * (text formats only — PDFs and images need an extraction first).
 *
 * Re-ingestion (E5): previously active resources for the document are
 * soft-deleted so the new resource supersedes them; their embeddings stay
 * on disk but drop out of retrieval (which filters deleted resources).
 */
async function runIngest(
  document: { id: string; filename: string; filepath: string },
  workspaceId: string,
): Promise<IngestDocumentOutcome> {
  // 1. Latest approved completed extraction for this document
  const [extraction] = await db
    .select({
      id: extractions.id,
      currentContent: extractions.currentContent,
      rawOutput: extractions.rawOutput,
    })
    .from(extractions)
    .where(
      and(
        eq(extractions.documentId, document.id),
        eq(extractions.status, "completed"),
        eq(extractions.approved, true),
        isNull(extractions.deletedAt),
      ),
    )
    .orderBy(desc(extractions.createdAt), desc(extractions.updatedAt))
    .limit(1);

  let content: string | null = null;
  let source: "extraction" | "file" = "file";

  if (extraction) {
    content = extraction.currentContent ?? extraction.rawOutput;
    if (content && content.trim()) source = "extraction";
  }

  // 2. Fallback to the raw uploaded file
  if (!content?.trim()) {
    const ext = path.extname(document.filename).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return {
        success: false,
        error: `No approved extraction and unsupported file format: ${ext}. Run an extraction first.`,
      };
    }
    try {
      content = new TextDecoder().decode(
        await getDocumentObject(document.filepath),
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch file",
      };
    }
  }

  // 3. Supersede the document's previous active resources (E5)
  await db
    .update(resources)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(resources.documentId, document.id), isNull(resources.deletedAt)),
    );

  // 4. Insert the new resource
  const [resource] = await db
    .insert(resources)
    .values({ workspaceId, content, documentId: document.id })
    .returning({ id: resources.id });

  // 5. Chunk and embed
  const chunks = generateChunks(content);
  let embeddingTokens: number | null = null;
  if (chunks.length > 0) {
    const { vectors, tokens } = await generateEmbeddings(chunks);
    embeddingTokens = tokens;
    await db.insert(embeddings).values(
      chunks.map((chunk, i) => ({
        workspaceId,
        resourceId: resource.id,
        content: chunk,
        embedding: vectors[i],
      })),
    );
  }

  // 6. Link the consumed extraction to the resource and mark the document ingested
  if (extraction) {
    await db
      .update(extractions)
      .set({ resourceId: resource.id })
      .where(eq(extractions.id, extraction.id));
  }
  await db
    .update(documents)
    .set({ ingested: true })
    .where(eq(documents.id, document.id));

  return {
    success: true,
    chunksCount: chunks.length,
    resourceId: resource.id,
    source,
    embeddingTokens,
  };
}
