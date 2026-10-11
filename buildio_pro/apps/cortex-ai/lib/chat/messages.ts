import type { UIMessage } from "ai";

import type { ChatAttachment, ChatMessageMetadata } from "@/api/chat/types";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema/messages";

/** Join the text parts of a UI message into a single string. */
export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

/** The most recent user message, or null when there is none. */
export function getLastUserMessage(
  messages: UIMessage<ChatMessageMetadata>[],
): UIMessage<ChatMessageMetadata> | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i];
    }
  }
  return null;
}

/** Derive a short thread title from the first user query. */
export function deriveThreadTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 60) return normalized || "New chat";
  return `${normalized.slice(0, 60)}…`;
}

/**
 * Persist a user message. Uses the AI SDK message id as the primary key so
 * resending history (reloads, regenerations) does not create duplicates.
 */
export async function persistUserMessage(
  threadId: string,
  message: UIMessage,
  attachments: ChatAttachment[] = [],
): Promise<void> {
  const content = getMessageText(message);
  if (!content && attachments.length === 0) return;

  await db
    .insert(chatMessages)
    .values({ id: message.id, threadId, role: "user", content, attachments })
    .onConflictDoNothing();
}

/**
 * Persist an assistant message, upserting by id so a regenerated response
 * replaces the previous text instead of duplicating the row.
 */
export async function persistAssistantMessage(
  threadId: string,
  messageId: string,
  content: string,
): Promise<void> {
  await db
    .insert(chatMessages)
    .values({ id: messageId, threadId, role: "assistant", content })
    .onConflictDoUpdate({
      target: chatMessages.id,
      set: { content },
    });
}
