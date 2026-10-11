import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { NextRequest, NextResponse, after } from "next/server";

import { encryptSecret } from "@/lib/connectors/crypto";
import { probeConnection } from "@/lib/connectors/probe";
import { refreshConnectorSchema } from "@/lib/connectors/schema-sync/reconcile";
import {
  connectionCreateSchema,
} from "@/lib/connectors/validation";
import { toConnectionView } from "@/lib/connectors/view";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
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
        connections: [],
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
    const includeDeleted =
      request.nextUrl.searchParams.get("status") === "deleted";
    const where = and(
      eq(connections.workspaceId, workspace.id),
      includeDeleted
        ? isNotNull(connections.deletedAt)
        : isNull(connections.deletedAt),
    );
    const [{ total }] = await db
      .select({ total: count() })
      .from(connections)
      .where(where);
    const rows = await db
      .select()
      .from(connections)
      .where(where)
      .orderBy(asc(connections.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      connections: rows.map(toConnectionView),
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
    const parsed = connectionCreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    const input = parsed.data;

    const existing = await db
      .select({ id: connections.id })
      .from(connections)
      .where(
        and(
          eq(connections.workspaceId, workspace.id),
          eq(connections.name, input.name),
          isNull(connections.deletedAt),
        ),
      )
      .limit(1);
    if (existing.length)
      return NextResponse.json(
        { error: "A connection with this name already exists" },
        { status: 409 },
      );

    const probe = await probeConnection({
      type: input.type,
      host: input.host,
      port: input.port,
      database: input.database,
      username: input.username,
      password: input.password,
    });
    if (!probe.ok)
      return NextResponse.json(
        {
          error: `Connection check failed: ${probe.error ?? "unreachable"}`,
        },
        { status: 400 },
      );

    const [row] = await db
      .insert(connections)
      .values({
        workspaceId: workspace.id,
        name: input.name,
        type: input.type,
        host: input.host,
        port: input.port,
        username: input.username,
        passwordEncrypted: encryptSecret(input.password),
        database: input.database,
        status: "connected",
        lastCheckedAt: new Date(),
        lastError: null,
        createdBy: user.id,
      })
      .returning();

    // First-time scenario: schedule the initial schema sync after the response
    // so the connector has tables without a manual refresh. Failures are
    // recorded on the sync row and surfaced in the UI; creation still succeeds.
    if (row.type === "postgres" || row.type === "mongodb") {
      after(async () => {
        try {
          await refreshConnectorSchema({
            workspaceId: workspace.id,
            connectionId: row.id,
            userId: user.id,
          });
        } catch (error) {
          console.error("Initial schema sync failed", error);
        }
      });
    }

    return NextResponse.json({ connection: toConnectionView(row) }, {
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
