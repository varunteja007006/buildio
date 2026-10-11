import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { decryptSecret } from "@/lib/connectors/crypto";
import { getPostgresTableMetadata } from "@/lib/connectors/table-metadata";
import { DEFAULT_PORTS } from "@/lib/connectors/validation";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema/connections";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
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
    const { searchParams } = new URL(request.url);
    const schema = searchParams.get("schema");
    const name = searchParams.get("name");
    if (!schema || !name || schema.length > 256 || name.length > 256)
      return NextResponse.json(
        { error: "A valid schema and table name are required" },
        { status: 400 },
      );

    const [connection] = await db
      .select()
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
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 },
      );
    if (connection.type !== "postgres")
      return NextResponse.json(
        { error: "Table details are only supported for PostgreSQL" },
        { status: 400 },
      );

    const details = await getPostgresTableMetadata(
      {
        type: "postgres",
        host: connection.host ?? "",
        port: connection.port ?? DEFAULT_PORTS.postgres,
        database: connection.database ?? "",
        username: connection.username ?? "",
        password: connection.passwordEncrypted
          ? decryptSecret(connection.passwordEncrypted)
          : "",
      },
      schema,
      name,
    );
    if (!details)
      return NextResponse.json(
        { error: "Database object not found" },
        { status: 404 },
      );
    return NextResponse.json({ details });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
