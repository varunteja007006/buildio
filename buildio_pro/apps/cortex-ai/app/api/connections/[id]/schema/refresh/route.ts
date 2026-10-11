import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { schemaRefreshInputSchema } from "@/api/connections/schema-contracts";
import {
  refreshErrorStatus,
  type SyncErrorCode,
} from "@/lib/connectors/schema-sync/errors";
import { refreshConnectorSchema } from "@/lib/connectors/schema-sync/reconcile";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = schemaRefreshInputSchema.safeParse(body ?? {});
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );

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

  const result = await refreshConnectorSchema({
    workspaceId: workspace.id,
    connectionId: id,
    userId: user.id,
    declareReplacement: parsed.data.declareReplacement === true,
  });
  if (result.status === "failed" && result.errorCode) {
    return NextResponse.json(
      {
        error: result.errorMessage,
        code: result.errorCode satisfies SyncErrorCode,
      },
      { status: refreshErrorStatus(result.errorCode) },
    );
  }
  return NextResponse.json(result);
}
