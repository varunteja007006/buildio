import { NextResponse } from "next/server";

import {
  getPostgresConnector,
  inspectPostgresMetadata,
} from "@/lib/connectors/description-metadata";
import { loadTableExplanations } from "@/lib/connectors/table-explanations";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

type Params = { params: Promise<{ id: string }> };

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

    const config = await getPostgresConnector((await params).id, workspace.id);
    const metadata = await inspectPostgresMetadata(config);
    const explanations = await loadTableExplanations(
      (await params).id,
      workspace.id,
    );
    return NextResponse.json(
      { metadata, savedExplanationCount: explanations.size },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to inspect connector";
    const known =
      /Connected Postgres connector not found|Connector host is not allowed|exceeds the (3,000-column|200-table) limit/.test(
        message,
      );
    const status = message.includes("not found") ? 404 : known ? 400 : 502;
    return NextResponse.json(
      { error: known ? message : "Unable to inspect connector schema" },
      { status },
    );
  }
}
