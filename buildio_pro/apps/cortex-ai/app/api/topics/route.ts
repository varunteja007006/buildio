import { and, asc, count, eq, isNull, max } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema/topics";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import {
  DESCRIPTION_MAX_LENGTH,
  findTextLengthError,
  NAME_MAX_LENGTH,
} from "@/lib/text-limits";
import { getActiveWorkspace } from "@/lib/workspaces";

const MAX_TOPICS = 10;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json({ topics: [] });
    }

    const topicList = await db
      .select()
      .from(topics)
      .where(
        and(eq(topics.workspaceId, workspace.id), isNull(topics.deletedAt)),
      )
      .orderBy(asc(topics.position), asc(topics.createdAt));

    return NextResponse.json({ topics: topicList });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const workspace = await getActiveWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "No active workspace" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Topic name is required" },
        { status: 400 },
      );
    }
    const lengthError = findTextLengthError([
      { label: "Topic name", value: name, maxLength: NAME_MAX_LENGTH },
      {
        label: "Description",
        value: description,
        maxLength: DESCRIPTION_MAX_LENGTH,
      },
    ]);
    if (lengthError)
      return NextResponse.json(
        { success: false, error: lengthError },
        { status: 400 },
      );

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Topic name must contain letters or numbers" },
        { status: 400 },
      );
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(topics)
      .where(
        and(eq(topics.workspaceId, workspace.id), isNull(topics.deletedAt)),
      );

    if (total >= MAX_TOPICS) {
      return NextResponse.json(
        { success: false, error: `Maximum of ${MAX_TOPICS} topics allowed` },
        { status: 409 },
      );
    }

    const [{ slugCount }] = await db
      .select({ slugCount: count() })
      .from(topics)
      .where(
        and(
          eq(topics.workspaceId, workspace.id),
          isNull(topics.deletedAt),
          eq(topics.slug, slug),
        ),
      );

    if (slugCount > 0) {
      return NextResponse.json(
        { success: false, error: "A topic with this name already exists" },
        { status: 409 },
      );
    }

    const [{ maxPosition }] = await db
      .select({ maxPosition: max(topics.position) })
      .from(topics)
      .where(
        and(eq(topics.workspaceId, workspace.id), isNull(topics.deletedAt)),
      );

    const [topic] = await db
      .insert(topics)
      .values({
        workspaceId: workspace.id,
        name,
        slug,
        description,
        position: (maxPosition ?? 0) + 1,
      })
      .returning();

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
