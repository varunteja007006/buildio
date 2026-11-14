"use client";

/**
 * Conversation demo — scrollable chat shell, empty state, scroll-to-bottom
 * button and a transcript download. Static messages, no streaming.
 */

import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@workspace/ui/components/ai-elements/message";
import { MessagesSquareIcon } from "lucide-react";


/**
 * Structurally mirrors `UIMessage` so the demo avoids importing "ai"
 * (not an apps/web dependency); assignable to `ConversationDownload`'s
 * `messages` prop.
 */
type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
};

const demoMessages: DemoMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "How do I add a tool to my agent?" }],
  },
  {
    id: "msg-2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Register the handler in the tool registry and mention it in the system prompt so the model knows when to call it.",
      },
    ],
  },
  {
    id: "msg-3",
    role: "user",
    parts: [{ type: "text", text: "Can it stream results back?" }],
  },
  {
    id: "msg-4",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Yes — emit partial output while the tool runs and finalize with a status badge.",
      },
    ],
  },
];

const messageText = (message: DemoMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

export function ConversationDemo() {
  return (
    <div className="relative flex h-72 flex-col overflow-hidden rounded-md border bg-muted/20">
      <Conversation className="h-full">
        <ConversationContent>
          {demoMessages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>{messageText(message)}</MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
        <ConversationDownload messages={demoMessages} />
      </Conversation>
    </div>
  );
}

export function ConversationEmptyStateDemo() {
  return (
    <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border bg-muted/20">
      <ConversationEmptyState
        description="Ask anything to get started — demos run fully client-side."
        icon={<MessagesSquareIcon className="size-6" />}
        title="No messages yet"
      />
    </div>
  );
}
