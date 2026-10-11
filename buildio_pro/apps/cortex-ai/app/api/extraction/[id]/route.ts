import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { extractionVersions } from "@/lib/db/schema/extraction-versions";
import { extractions } from "@/lib/db/schema/extractions";
import { getCurrentUser } from "@/lib/session";
import { EXTRACTION_CONTENT_MAX_LENGTH } from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

/** Fetch a single extraction (with its document) for the review dialog. */
export async function GET(_request: Request, { params }: Params) {
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

    // No deletedAt filter: soft-deleted extractions stay inspectable.
    const [row] = await db
      .select({
        extraction: extractions,
        filename: documents.filename,
        filepath: documents.filepath,
      })
      .from(extractions)
      .innerJoin(documents, eq(extractions.documentId, documents.id))
      .where(
        and(eq(extractions.id, id), eq(documents.workspaceId, workspace.id)),
      )
      .limit(1);
    if (!row)
      return NextResponse.json(
        { error: "Extraction not found" },
        { status: 404 },
      );

    return NextResponse.json({
      extraction: row.extraction,
      document: {
        id: row.extraction.documentId,
        filename: row.filename,
        filepath: row.filepath,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Update an extraction: save an edited output (creates a `user` version and
 * clears approval) and/or toggle the approved flag (completed only).
 */
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

    const [row] = await db
      .select({ extraction: extractions })
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
    const extraction = row.extraction;

    const body = await request.json().catch(() => null);
    const newContent =
      typeof body?.currentContent === "string" ? body.currentContent : null;
    const wantsApproval = body?.approved === true;
    const wantsApprovalChange =
      body?.approved === true || body?.approved === false;

    if (
      newContent !== null &&
      newContent.length > EXTRACTION_CONTENT_MAX_LENGTH
    )
      return NextResponse.json(
        {
          error: `Content must be at most ${EXTRACTION_CONTENT_MAX_LENGTH} characters`,
        },
        { status: 400 },
      );

    const contentChanged =
      newContent !== null && newContent !== extraction.currentContent;
    if (!contentChanged && !wantsApprovalChange)
      return NextResponse.json(
        { error: "No valid changes supplied" },
        { status: 400 },
      );
    if (wantsApproval && extraction.status !== "completed")
      return NextResponse.json(
        { error: "Only completed extractions can be approved" },
        { status: 400 },
      );

    // Content changed → append a `user` version and reset the stale approval.
    if (contentChanged) {
      const [{ nextVersion }] = await db
        .select({
          nextVersion: sql<number>`coalesce(max(${extractionVersions.version}), 0) + 1`,
        })
        .from(extractionVersions)
        .where(eq(extractionVersions.extractionId, id));

      await db.insert(extractionVersions).values({
        extractionId: id,
        version: nextVersion,
        source: "user",
        content: newContent,
        structuredOutput: null,
        createdBy: user.id,
      });
    }

    const [updated] = await db
      .update(extractions)
      .set({
        ...(contentChanged ? { currentContent: newContent } : {}),
        ...(wantsApprovalChange
          ? { approved: wantsApproval && !contentChanged }
          : {}),
      })
      .where(eq(extractions.id, id))
      .returning();

    return NextResponse.json({ extraction: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Soft-delete an extraction (versions stay intact for audit). */
export async function DELETE(_request: Request, { params }: Params) {
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
    const [existing] = await db
      .select({ id: extractions.id })
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
    if (!existing)
      return NextResponse.json(
        { error: "Extraction not found" },
        { status: 404 },
      );

    await db
      .update(extractions)
      .set({ deletedAt: sql`now()` })
      .where(eq(extractions.id, id));
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
