import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import type { ChatAttachment, ChatMessageMetadata } from "@/api/chat/types";
import { getAgentChatContext } from "@/lib/agents/chat-context";
import {
  addChatAttachmentParts,
  parseChatAttachments,
} from "@/lib/chat/attachments";
import {
  getLastUserQuery,
  recordBlockedChatAudit,
  recordChatAudit,
} from "@/lib/chat/audit";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/constants";
import { GUARDRAIL_REFUSAL, scanUserQuery } from "@/lib/chat/guardrail";
import {
  deriveThreadTitle,
  getLastUserMessage,
  getMessageText,
  persistAssistantMessage,
  persistUserMessage,
} from "@/lib/chat/messages";
import {
  getDefaultChatModelId,
  isWellFormedChatModelId,
} from "@/lib/chat/models";
import { getOrCreateChatPreferences } from "@/lib/chat/preferences";
import { buildRefusalStream } from "@/lib/chat/stream";
import { getThreadForUser, touchThread } from "@/lib/chat/threads";
import { getCurrentUser } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspaces";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer clearly and accurately using the conversation for context. If you are unsure, say so.";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    return NextResponse.json(
      { success: false, error: "No active workspace" },
      { status: 400 },
    );
  }

  const {
    messages,
    model,
    threadId,
    agentId,
  }: {
    messages: UIMessage<ChatMessageMetadata>[];
    model?: string;
    threadId?: string;
    agentId?: string;
  } = await req.json();

  let thread = null;
  if (typeof threadId === "string" && threadId) {
    thread = await getThreadForUser(threadId, user.id, workspace.id);
    if (!thread) {
      return NextResponse.json(
        { success: false, error: "Thread not found" },
        { status: 404 },
      );
    }
  }

  // Agent context: bound playground thread or explicit agentId in the body.
  const effectiveAgentId = thread?.agentId ?? agentId ?? null;
  const agentContext = effectiveAgentId
    ? await getAgentChatContext(effectiveAgentId, workspace.id)
    : null;
  if (effectiveAgentId && !agentContext) {
    return NextResponse.json(
      { success: false, error: "Agent not found" },
      { status: 404 },
    );
  }

  let resolvedModel = getDefaultChatModelId();
  if (model != null) {
    if (!isWellFormedChatModelId(model)) {
      return NextResponse.json(
        { success: false, error: "Invalid model" },
        { status: 400 },
      );
    }
    resolvedModel = model;
  } else if (thread?.model) {
    resolvedModel = thread.model;
  } else {
    const preferences = await getOrCreateChatPreferences(user.id);
    resolvedModel = preferences.defaultModel;
  }

  const userMessage = getLastUserMessage(messages);
  const userQuery = userMessage
    ? getMessageText(userMessage)
    : getLastUserQuery(messages);
  const userMessageLength = userMessage
    ? userMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n").length
    : userQuery.length;

  if (userMessageLength > MAX_CHAT_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `Message must be ${MAX_CHAT_MESSAGE_LENGTH.toLocaleString()} characters or fewer.`,
      },
      { status: 400 },
    );
  }

  let attachments: ChatAttachment[] = [];
  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;
  const hasAttachments = messages.some(
    (message) => (message.metadata?.attachments?.length ?? 0) > 0,
  );
  try {
    attachments = parseChatAttachments(userMessage?.metadata?.attachments);
    if (hasAttachments) {
      if (!thread) throw new Error("Attachments require a chat thread");
      if (thread.agentId)
        throw new Error("Agent chats do not accept attachments");
      const messagesWithAttachments = await addChatAttachmentParts(
        messages,
        workspace.id,
        thread.id,
      );
      modelMessages = await convertToModelMessages(messagesWithAttachments);
    } else {
      modelMessages = await convertToModelMessages(messages);
    }
  } catch (error) {
    console.error("Invalid chat attachment", error);
    return NextResponse.json(
      {
        success: false,
        error: "One or more attachments are invalid or unavailable.",
      },
      { status: 400 },
    );
  }

  const guardrail = await scanUserQuery(userQuery);

  if (thread) {
    if (userMessage) {
      await persistUserMessage(thread.id, userMessage, attachments);
    }
    await touchThread({
      threadId: thread.id,
      userId: user.id,
      workspaceId: workspace.id,
      title: userQuery ? deriveThreadTitle(userQuery) : undefined,
      model: resolvedModel,
    });
  }

  // Guardrail: refuse risky queries before calling the chat model.
  if (guardrail.blocked) {
    const messageId = crypto.randomUUID();

    if (thread) {
      await persistAssistantMessage(thread.id, messageId, GUARDRAIL_REFUSAL);
    }

    void recordBlockedChatAudit({
      userId: user.id,
      workspaceId: workspace.id,
      threadId: thread?.id,
      model: resolvedModel,
      userQuery,
      guardrail,
    }).catch((error) => {
      console.error("Failed to record blocked chat audit log", error);
    });

    return createUIMessageStreamResponse({
      stream: buildRefusalStream(messageId),
    });
  }

  const result = streamText({
    model: resolvedModel,
    system: agentContext
      ? `You are ${agentContext.name}, an AI agent. Follow these instructions:\n${agentContext.instructions}`
      : SYSTEM_PROMPT,
    messages: modelMessages,
    stopWhen: isStepCount(5),
    ...(hasAttachments
      ? {}
      : { include: { requestBody: true, requestMessages: true } }),
    onEnd: (event) => {
      void recordChatAudit({
        userId: user.id,
        workspaceId: workspace.id,
        threadId: thread?.id,
        model: resolvedModel,
        userQuery,
        event,
        guardrail,
      }).catch((error) => {
        console.error("Failed to record chat audit log", error);
      });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      generateMessageId: generateId,
      onEnd: async ({ responseMessage }) => {
        if (!thread) return;
        const content = getMessageText(responseMessage);
        if (!content) return;
        try {
          await persistAssistantMessage(thread.id, responseMessage.id, content);
          await touchThread({
            threadId: thread.id,
            userId: user.id,
            workspaceId: workspace.id,
          });
        } catch (error) {
          console.error("Failed to persist assistant message", error);
        }
      },
    }),
  });
}
