import path from "node:path";

import { NextResponse } from "next/server";

import { suggestTemplateFromDocument } from "@/lib/extraction/suggest-template";
import { getCurrentUser } from "@/lib/session";
import { MAX_DOCUMENT_SIZE } from "@/lib/storage/s3";
import { getActiveWorkspace } from "@/lib/workspaces";

/** Same formats the extraction pipeline can read. */
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".md",
  ".mdx",
  ".txt",
  ".csv",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

/**
 * Draft an extraction template from a sample document. The upload is read
 * in memory for the suggestion only — it is never stored or ingested.
 */
export async function POST(request: Request) {
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

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string")
      return NextResponse.json(
        { error: "Attach a sample document to generate from" },
        { status: 400 },
      );
    if (file.size === 0)
      return NextResponse.json(
        { error: "The attached document is empty" },
        { status: 400 },
      );
    if (file.size > MAX_DOCUMENT_SIZE)
      return NextResponse.json(
        { error: "Document exceeds the 10 MB limit" },
        { status: 400 },
      );

    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension))
      return NextResponse.json(
        {
          error:
            "Unsupported document type. Supported: PDF, images, Markdown, text and CSV.",
        },
        { status: 400 },
      );

    const suggestion = await suggestTemplateFromDocument({
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
