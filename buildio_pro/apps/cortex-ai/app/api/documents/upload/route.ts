import { NextResponse } from "next/server";
import { z } from "zod";

import { getUploadDestination } from "@/lib/documents/upload";
import { getCurrentUser } from "@/lib/session";
import {
  buildDocumentKey,
  getDocumentUploadUrl,
  MAX_DOCUMENT_SIZE,
} from "@/lib/storage/s3";
import { getActiveWorkspace } from "@/lib/workspaces";

const inputSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_DOCUMENT_SIZE),
  contentType: z.string().max(255).default("application/octet-stream"),
  folderId: z.string().optional(),
});

const allowedExtensions = new Set([
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

    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid upload details" },
        { status: 400 },
      );
    }
    const { filename, contentType, folderId } = parsed.data;
    const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported document type" },
        { status: 400 },
      );
    }
    const destination = await getUploadDestination(workspace.id, folderId);
    if (!destination)
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });

    const key = buildDocumentKey(workspace.id, filename);
    const uploadUrl = await getDocumentUploadUrl(key, contentType);
    return NextResponse.json({ key, uploadUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
