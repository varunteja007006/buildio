import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { resources } from "@/lib/db/schema/resources";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

const MAX_PAGE_SIZE = 100;
const PREVIEW_LENGTH = 240;

type IngestFilter = "all" | "pending" | "failed" | "ingested";

function parseFilter(value: string | null): IngestFilter {
  return value === "pending" || value === "failed" || value === "ingested"
    ? value
    : "all";
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace)
      return NextResponse.json({
        items: [],
        stats: { pending: 0, failed: 0, ingested: 0 },
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
    const filter = parseFilter(request.nextUrl.searchParams.get("status"));

    // A document is "failed" when the latest attempt errored, even if an
    // older ingest succeeded (its resources may have been superseded).
    const active = and(
      eq(documents.workspaceId, workspace.id),
      isNull(documents.deletedAt),
    );
    const where =
      filter === "pending"
        ? and(
            active,
            eq(documents.ingested, false),
            isNull(documents.lastIngestError),
          )
        : filter === "failed"
          ? and(active, isNotNull(documents.lastIngestError))
          : filter === "ingested"
            ? and(
                active,
                eq(documents.ingested, true),
                isNull(documents.lastIngestError),
              )
            : active;

    const [stats] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${documents.ingested} = false and ${documents.lastIngestError} is null)::int`,
        failed: sql<number>`count(*) filter (where ${documents.lastIngestError} is not null)::int`,
        ingested: sql<number>`count(*) filter (where ${documents.ingested} = true and ${documents.lastIngestError} is null)::int`,
      })
      .from(documents)
      .where(active);

    const [totalRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(documents)
      .where(where);

    // A document has at most one active resource (ingest supersedes previous
    // ones), so this join is 1:0..1. Chunk counts come from the embeddings
    // of that resource; extraction presence drives the Source badge.
    const items = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        ingested: documents.ingested,
        lastIngestError: documents.lastIngestError,
        hasApprovedExtraction: sql<boolean>`exists (
          select 1 from extractions x
          where x.document_id = ${documents.id}
            and x.status = 'completed'
            and x.approved = true
            and x.deleted_at is null
        )`,
        chunks: sql<number>`(
          select count(*)::int from embeddings e
          where e.resource_id = ${resources.id}
            and e.deleted_at is null
        )`,
        lastIngestedAt: resources.createdAt,
        resourceId: resources.id,
        preview: sql<
          string | null
        >`left(${resources.content}, ${PREVIEW_LENGTH})`,
        contentLength: sql<number | null>`length(${resources.content})::int`,
      })
      .from(documents)
      .leftJoin(
        resources,
        and(
          eq(resources.documentId, documents.id),
          isNull(resources.deletedAt),
        ),
      )
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = totalRow?.total ?? 0;
    return NextResponse.json({
      items,
      stats: stats ?? { pending: 0, failed: 0, ingested: 0 },
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
