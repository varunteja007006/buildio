import { and, asc, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { schemaListQuerySchema } from "@/api/connections/schema-contracts";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import {
  connectorSchemaSyncs,
  connectorTableContexts,
  connectorTables,
} from "@/lib/db/schema/connector-schema";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });

  const { id } = await params;
  const [connection] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.id, id),
        eq(connections.workspaceId, workspace.id),
        isNull(connections.deletedAt),
      ),
    )
    .limit(1);
  if (!connection)
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  const parsed = schemaListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 },
    );
  const { status, search, schema, objectType, page, pageSize } = parsed.data;

  const conditions: (SQL | undefined)[] = [
    eq(connectorTables.connectionId, id),
    eq(connectorTables.workspaceId, workspace.id),
  ];
  if (status !== "all") conditions.push(eq(connectorTables.status, status));
  if (schema && schema !== "all")
    conditions.push(eq(connectorTables.schemaName, schema));
  if (objectType && objectType !== "all")
    conditions.push(eq(connectorTables.objectType, objectType));
  if (search && search.trim())
    conditions.push(
      or(
        ilike(connectorTables.schemaName, `%${search.trim()}%`),
        ilike(connectorTables.tableName, `%${search.trim()}%`),
      ),
    );

  const [summary, schemaRows, totalRow] = await Promise.all([
    db
      .select({ status: connectorTables.status, total: count() })
      .from(connectorTables)
      .where(
        and(
          eq(connectorTables.connectionId, id),
          eq(connectorTables.workspaceId, workspace.id),
        ),
      )
      .groupBy(connectorTables.status),
    db
      .selectDistinct({ schemaName: connectorTables.schemaName })
      .from(connectorTables)
      .where(
        and(
          eq(connectorTables.connectionId, id),
          eq(connectorTables.workspaceId, workspace.id),
        ),
      )
      .orderBy(asc(connectorTables.schemaName)),
    db
      .select({ total: count() })
      .from(connectorTables)
      .where(and(...conditions)),
  ]);
  const summaryMap = Object.fromEntries(
    summary.map((row) => [row.status, row.total]),
  );
  const total = totalRow[0]?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rows = await db
    .select({
      id: connectorTables.id,
      sourceEpoch: connectorTables.sourceEpoch,
      schemaName: connectorTables.schemaName,
      tableName: connectorTables.tableName,
      objectType: connectorTables.objectType,
      databaseComment: connectorTables.databaseComment,
      status: connectorTables.status,
      reviewReason: connectorTables.reviewReason,
      lastSeenAt: connectorTables.lastSeenAt,
      updatedAt: connectorTables.updatedAt,
      explanation: connectorTableContexts.explanation,
      revision: connectorTableContexts.revision,
    })
    .from(connectorTables)
    .leftJoin(
      connectorTableContexts,
      eq(connectorTableContexts.tableId, connectorTables.id),
    )
    .where(and(...conditions))
    .orderBy(asc(connectorTables.schemaName), asc(connectorTables.tableName))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [lastSync] = await db
    .select({
      id: connectorSchemaSyncs.id,
      status: connectorSchemaSyncs.status,
      sourceEpoch: connectorSchemaSyncs.sourceEpoch,
      tableCount: connectorSchemaSyncs.tableCount,
      errorCode: connectorSchemaSyncs.errorCode,
      errorMessage: connectorSchemaSyncs.errorMessage,
      startedAt: connectorSchemaSyncs.startedAt,
      completedAt: connectorSchemaSyncs.completedAt,
    })
    .from(connectorSchemaSyncs)
    .where(eq(connectorSchemaSyncs.connectionId, id))
    .orderBy(desc(connectorSchemaSyncs.startedAt));

  return NextResponse.json({
    tables: rows,
    page,
    pageSize,
    total,
    pageCount,
    lastSync: lastSync ?? null,
    summary: {
      active: summaryMap["active"] ?? 0,
      removed: summaryMap["removed"] ?? 0,
      "needs-review": summaryMap["needs-review"] ?? 0,
    },
    schemas: schemaRows.map((row) => row.schemaName),
  });
}
