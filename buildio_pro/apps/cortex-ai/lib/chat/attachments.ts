import type { UIMessage } from "ai";
import { z } from "zod";

import type { ChatAttachment, ChatMessageMetadata } from "@/api/chat/types";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENTS_SIZE,
  MAX_CHAT_ATTACHMENT_SIZE,
} from "@/lib/chat/constants";
import { loadDocumentFile } from "@/lib/extraction/extract-text";
import { documentObjectExists } from "@/lib/storage/s3";

const attachmentSchema = z.object({
  key: z.string().min(1),
  filename: z.string().trim().min(1).max(255),
  mediaType: z.string().min(1),
  size: z.number().int().positive().max(MAX_CHAT_ATTACHMENT_SIZE),
});

const mediaTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".mdx": "text/markdown",
  ".csv": "text/csv",
};

export function getChatAttachmentMediaType(filename: string) {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return mediaTypes[extension];
}

export function parseChatAttachments(value: unknown): ChatAttachment[] {
  const parsed = z
    .array(attachmentSchema)
    .max(MAX_CHAT_ATTACHMENTS)
    .safeParse(value ?? []);
  if (!parsed.success) throw new Error("Invalid chat attachments");

  const attachments = parsed.data;
  if (
    attachments.reduce((total, attachment) => total + attachment.size, 0) >
    MAX_CHAT_ATTACHMENTS_SIZE
  ) {
    throw new Error("Attachments exceed the 20 MiB per-message limit");
  }

  for (const attachment of attachments) {
    if (
      getChatAttachmentMediaType(attachment.filename) !== attachment.mediaType
    ) {
      throw new Error("Unsupported chat attachment type");
    }
  }
  return attachments;
}

/** Load private bucket objects into the corresponding user messages for the model. */
export async function addChatAttachmentParts(
  messages: UIMessage<ChatMessageMetadata>[],
  workspaceId: string,
  threadId: string,
) {
  return Promise.all(
    messages.map(async (message) => {
      if (message.role !== "user") return message;
      const attachments = parseChatAttachments(message.metadata?.attachments);
      if (!attachments.length) return message;

      const parts = [...message.parts];
      for (const attachment of attachments) {
        const prefix = `chat-attachments/${workspaceId}/${threadId}/`;
        if (!attachment.key.startsWith(prefix)) {
          throw new Error("Invalid chat attachment key");
        }
        if (!(await documentObjectExists(attachment.key, attachment.size))) {
          throw new Error("Chat attachment size mismatch");
        }
        const file = await loadDocumentFile(
          attachment.filename,
          attachment.key,
        );
        if (file.bytes.byteLength !== attachment.size) {
          throw new Error("Chat attachment size mismatch");
        }

        if (file.isPdf) {
          parts.push({
            type: "text",
            text: `Attached document: ${attachment.filename}`,
          });
          parts.push({
            type: "file",
            filename: attachment.filename,
            mediaType: attachment.mediaType,
            url: `data:${attachment.mediaType};base64,${Buffer.from(file.bytes).toString("base64")}`,
          });
        } else {
          parts.push({
            type: "text",
            text: `\n\n[Attached document: ${attachment.filename}]\n${new TextDecoder().decode(file.bytes)}`,
          });
        }
      }
      return { ...message, parts };
    }),
  );
}
