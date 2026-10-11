import { NextResponse } from "next/server";
import { z } from "zod";

import { getChatAttachmentMediaType } from "@/lib/chat/attachments";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENTS_SIZE,
  MAX_CHAT_ATTACHMENT_SIZE,
} from "@/lib/chat/constants";
import { getThreadForUser } from "@/lib/chat/threads";
import { getCurrentUser } from "@/lib/session";
import {
  buildChatAttachmentKey,
  deleteDocumentObject,
  getDocumentUploadUrl,
} from "@/lib/storage/s3";
import { getActiveWorkspace } from "@/lib/workspaces";

const uploadFileSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_CHAT_ATTACHMENT_SIZE),
});

const uploadSchema = z
  .object({
    threadId: z.string().uuid(),
    files: z.array(uploadFileSchema).min(1).max(MAX_CHAT_ATTACHMENTS),
  })
  .refine(
    ({ files }) =>
      files.reduce((total, file) => total + file.size, 0) <=
      MAX_CHAT_ATTACHMENTS_SIZE,
  );

const cleanupSchema = z.object({
  threadId: z.string().uuid(),
  keys: z.array(z.string().min(1)).max(3),
});

async function getAuthorizedThread(threadId: string) {
  const user = await getCurrentUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const workspace = await getActiveWorkspace(user.id);
  if (!workspace)
    return {
      error: NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      ),
    };
  const thread = await getThreadForUser(threadId, user.id, workspace.id);
  if (!thread || thread.agentId) {
    return {
      error: NextResponse.json(
        { error: "Chat thread not found" },
        { status: 404 },
      ),
    };
  }
  return { user, workspace, thread };
}

export async function POST(request: Request) {
  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid attachment details" },
      { status: 400 },
    );
  }
  const { threadId, files } = parsed.data;
  const auth = await getAuthorizedThread(threadId);
  if (auth.error) return auth.error;

  const mediaTypes = files.map(({ filename }) =>
    getChatAttachmentMediaType(filename),
  );
  if (mediaTypes.some((mediaType) => !mediaType)) {
    return NextResponse.json(
      { error: "Unsupported document type" },
      { status: 400 },
    );
  }

  try {
    const uploads = await Promise.all(
      files.map(async ({ filename, size }, index) => {
        const mediaType = mediaTypes[index]!;
        const key = buildChatAttachmentKey(
          auth.workspace.id,
          threadId,
          filename,
        );
        const uploadUrl = await getDocumentUploadUrl(key, mediaType);
        return { key, uploadUrl, mediaType, size };
      }),
    );
    return NextResponse.json({ uploads });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const parsed = cleanupSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cleanup request" },
      { status: 400 },
    );
  }
  const { threadId, keys } = parsed.data;
  const auth = await getAuthorizedThread(threadId);
  if (auth.error) return auth.error;

  const prefix = `chat-attachments/${auth.workspace.id}/${threadId}/`;
  if (keys.some((key) => !key.startsWith(prefix))) {
    return NextResponse.json(
      { error: "Invalid attachment key" },
      { status: 403 },
    );
  }

  await Promise.allSettled(keys.map(deleteDocumentObject));
  return NextResponse.json({ success: true });
}
