import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { MAX_CHAT_FEEDBACK_LENGTH } from "@/lib/chat/constants";
import { db } from "@/lib/db";
import { chatMessageFeedback } from "@/lib/db/schema/feedback";
import { chatMessages } from "@/lib/db/schema/messages";
import { chatThreads } from "@/lib/db/schema/threads";
import { getCurrentUser } from "@/lib/session";

type Params = {
  params: Promise<{ threadId: string; messageId: string }>;
};

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const current = await getCurrentUser();
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { threadId, messageId } = await params;
    const body = await request.json().catch(() => null);
    const rating =
      body?.rating === "up" || body?.rating === "down" ? body.rating : null;
    if (!rating)
      return NextResponse.json(
        { error: "rating must be 'up' or 'down'" },
        { status: 400 },
      );
    const rawComment = typeof body?.comment === "string" ? body.comment : null;
    if (rawComment && rawComment.length > MAX_CHAT_FEEDBACK_LENGTH)
      return NextResponse.json(
        {
          error: `comment must be at most ${MAX_CHAT_FEEDBACK_LENGTH} characters`,
        },
        { status: 400 },
      );
    const comment = rawComment?.trim() || null;

    const [thread] = await db
      .select({ id: chatThreads.id, agentId: chatThreads.agentId })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, current.id),
          isNull(chatThreads.deletedAt),
        ),
      )
      .limit(1);
    if (!thread)
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    const [message] = await db
      .select({ id: chatMessages.id, role: chatMessages.role })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.id, messageId),
          eq(chatMessages.threadId, threadId),
        ),
      )
      .limit(1);
    if (!message || message.role !== "assistant")
      return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const [feedback] = await db
      .insert(chatMessageFeedback)
      .values({
        messageId,
        threadId,
        agentId: thread.agentId,
        userId: current.id,
        rating,
        comment,
      })
      .onConflictDoUpdate({
        target: chatMessageFeedback.messageId,
        set: { rating, comment, updatedAt: sql`now()` },
      })
      .returning();

    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
