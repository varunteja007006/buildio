"use client";

import { Bubble, BubbleContent } from "@workspace/ui/components/bubble";
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller";
import { RelativeTime } from "@workspace/ui/components/relative-time";
import { isToolUIPart, type UIMessage } from "ai";
import { Paperclip } from "lucide-react";
import type { ReactNode } from "react";

import type { ChatMessageMetadata } from "@/api/chat/types";
import { MessageAudioButton } from "@/components/chat/message-audio-button";
import { ToolCalls } from "@/components/chat/tool-calls";
import { formatBytes } from "@/lib/file-upload.utils";

type ChatMessageProps = {
  message: UIMessage<ChatMessageMetadata>;
  /** Model id that produced this assistant reply, when known. */
  modelId?: string;
  /** Resolve a model id to a display label. */
  labelForModel?: (modelId: string) => string;
  /** Optional extras (e.g. feedback controls) below the bubble. */
  children?: ReactNode;
};

/** Renders a single chat turn (user or assistant) inside the message scroller. */
export function ChatMessage({
  message,
  modelId,
  labelForModel,
  children,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const toolParts = message.parts.filter(isToolUIPart);
  const textParts = message.parts.filter((part) => part.type === "text");
  const createdAt = message.metadata?.createdAt;
  const attachments = message.metadata?.attachments ?? [];
  const modelLabel =
    modelId && labelForModel ? labelForModel(modelId) : undefined;

  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={isUser}
      className="flex flex-col"
    >
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <span className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
          {isUser ? "You" : "Assistant"}
        </span>

        {/* Tool calls live in their own collapsible block, separate from the
            assistant's text response. */}
        {toolParts.length > 0 ? <ToolCalls parts={toolParts} /> : null}

        {textParts.length > 0 ? (
          <Bubble
            align={isUser ? "end" : "start"}
            variant={isUser ? "default" : "muted"}
          >
            <BubbleContent className="whitespace-pre-wrap">
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <span
                      key={attachment.key}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    >
                      <Paperclip className="size-3 shrink-0" />
                      <span className="max-w-48 truncate">
                        {attachment.filename}
                      </span>
                      <span className="text-muted-foreground">
                        {formatBytes(attachment.size)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {textParts.map((part, i) => (
                <p key={i}>{part.text}</p>
              ))}
            </BubbleContent>
          </Bubble>
        ) : null}

        {modelLabel || createdAt ? (
          <div className="mt-1 flex items-center gap-1.5 px-1 text-xs text-muted-foreground/70">
            {modelLabel ? <span>via {modelLabel}</span> : null}
            {modelLabel && createdAt ? <span aria-hidden>·</span> : null}
            {createdAt ? <RelativeTime date={createdAt} /> : null}
          </div>
        ) : null}

        {!isUser && textParts.length > 0 ? (
          <div className="mt-1 flex items-center gap-1">
            <MessageAudioButton
              text={textParts.map((part) => part.text).join("\n")}
            />
            {children}
          </div>
        ) : children ? (
          <div className="mt-1">{children}</div>
        ) : null}
      </div>
    </MessageScrollerItem>
  );
}
