import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema/agents";
import { user } from "@/lib/db/schema/auth";
import { agentFeedback } from "@/lib/db/schema/feedback";
import { getCurrentUser } from "@/lib/session";
import { FEEDBACK_COMMENT_MAX_LENGTH } from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user_ = await getCurrentUser();
    if (!user_)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await getActiveWorkspace(user_.id);
    if (!workspace)
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      );
    const { id } = await params;
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.workspaceId, workspace.id),
          isNull(agents.deletedAt),
        ),
      )
      .limit(1);
    if (!agent)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const feedback = await db
      .select({
        id: agentFeedback.id,
        userId: agentFeedback.userId,
        userName: user.name,
        rating: agentFeedback.rating,
        comment: agentFeedback.comment,
        createdAt: agentFeedback.createdAt,
      })
      .from(agentFeedback)
      .leftJoin(user, eq(agentFeedback.userId, user.id))
      .where(
        and(eq(agentFeedback.agentId, id), isNull(agentFeedback.deletedAt)),
      )
      .orderBy(desc(agentFeedback.createdAt));

    const total = feedback.length;
    const average =
      total > 0
        ? feedback.reduce((sum, entry) => sum + entry.rating, 0) / total
        : null;

    return NextResponse.json({ feedback, total, average });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user_ = await getCurrentUser();
    if (!user_)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await getActiveWorkspace(user_.id);
    if (!workspace)
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      );
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const rating = Number(body?.rating);
    const comment =
      typeof body?.comment === "string" ? body.comment.trim() || null : null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    if (comment && comment.length > FEEDBACK_COMMENT_MAX_LENGTH)
      return NextResponse.json(
        {
          error: `Comment must be at most ${FEEDBACK_COMMENT_MAX_LENGTH} characters`,
        },
        { status: 400 },
      );

    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.workspaceId, workspace.id),
          isNull(agents.deletedAt),
        ),
      )
      .limit(1);
    if (!agent)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const [feedback] = await db
      .insert(agentFeedback)
      .values({ agentId: id, userId: user_.id, rating, comment })
      .onConflictDoUpdate({
        target: [agentFeedback.agentId, agentFeedback.userId],
        targetWhere: sql`${agentFeedback.deletedAt} IS NULL`,
        set: { rating, comment, deletedAt: null, updatedAt: sql`now()` },
      })
      .returning();

    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
