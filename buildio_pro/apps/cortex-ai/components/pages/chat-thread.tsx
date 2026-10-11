"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@workspace/ui/components/message-scroller";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { uploadChatAttachments } from "@/api/chat/api";
import {
  chatKeys,
  useChatModels,
  useChatPreferences,
  useChatThread,
  useUpdateChatPreferences,
} from "@/api/chat/query";
import type { ChatMessageMetadata, ChatMessageRecord } from "@/api/chat/types";
import { endpoints } from "@/api/endpoints";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatModelSelector } from "@/components/chat/chat-model-selector";
import { MessageFeedback } from "@/components/chat/message-feedback";

/** Convert persisted message rows into AI SDK UI messages. */
function toUIMessages(
  records: ChatMessageRecord[],
): UIMessage<ChatMessageMetadata>[] {
  return records.map((record) => ({
    id: record.id,
    role: record.role,
    metadata: {
      createdAt: record.createdAt,
      ...(record.attachments.length ? { attachments: record.attachments } : {}),
    },
    parts: [{ type: "text", text: record.content }],
  }));
}

export function ChatThreadPage({ threadId }: { threadId: string }) {
  const queryClient = useQueryClient();

  const {
    data: threadData,
    isLoading: threadLoading,
    isError: threadError,
  } = useChatThread(threadId);
  const { data: modelsData, isLoading: modelsLoading } = useChatModels();
  const { data: preferences } = useChatPreferences();
  const updatePreferences = useUpdateChatPreferences();

  const models = useMemo(() => modelsData?.models ?? [], [modelsData]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const activeModel =
    selectedModel ??
    preferences?.defaultModel ??
    modelsData?.defaultModel ??
    undefined;

  // Latest request context, read by the stable transport at send time.
  const requestRef = useRef<{ threadId: string; model?: string }>({
    threadId,
  });
  requestRef.current = { threadId, model: activeModel };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api${endpoints.chat.stream}`,
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, ...requestRef.current },
        }),
      }),
    [],
  );

  const onFinish = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatKeys.thread(threadId) });
    queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
  }, [queryClient, threadId]);

  const { messages, setMessages, sendMessage, status, stop } = useChat<
    UIMessage<ChatMessageMetadata>
  >({
    id: threadId,
    transport,
    onFinish,
  });

  // Live messages have no server timestamp yet, so stamp them when first seen.
  const timestampsRef = useRef<Map<string, string>>(new Map());
  const messagesWithTime = useMemo<UIMessage<ChatMessageMetadata>[]>(
    () =>
      messages.map((message) => {
        if (message.metadata?.createdAt) return message;
        let createdAt = timestampsRef.current.get(message.id);
        if (!createdAt) {
          createdAt = new Date().toISOString();
          timestampsRef.current.set(message.id, createdAt);
        }
        return { ...message, metadata: { ...message.metadata, createdAt } };
      }),
    [messages],
  );

  // Seed the chat with persisted history once it loads.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !threadData) return;
    setMessages(toUIMessages(threadData.messages));
    hydratedRef.current = true;
  }, [threadData, setMessages]);

  // Refresh the sidebar history whenever we land on a thread — covers the
  // server-side /dashboard/chat redirect that may have just created one.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
  }, [queryClient, threadId]);

  // Model used for each user turn, in order — lets us annotate assistant
  // replies with the model that actually produced them.
  const turnModelsRef = useRef<string[]>([]);

  const labelForModel = useMemo(() => {
    const byId = new Map(models.map((model) => [model.id, model.label]));
    return (modelId: string) => byId.get(modelId) ?? modelId;
  }, [models]);

  const isStreaming = status === "streaming";

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    updatePreferences.mutate({ defaultModel: modelId });
  };

  const handleSend = async (text: string, files: File[]) => {
    const attachments = files.length
      ? await uploadChatAttachments(threadId, files)
      : [];
    if (activeModel) turnModelsRef.current.push(activeModel);
    await sendMessage({ text, metadata: { attachments } });
  };

  // Resolve which model produced the assistant message at the given index.
  const modelForMessage = (index: number): string | undefined => {
    let userTurns = 0;
    for (let i = 0; i < index; i++) {
      if (messages[i].role === "user") userTurns++;
    }
    if (userTurns === 0) return undefined;
    return turnModelsRef.current[userTurns - 1] ?? activeModel;
  };

  // Deleted or missing conversation: block the composer instead of letting
  // the user type into a thread that no longer exists.
  if (threadError) {
    return (
      <>
        <AppBreadcrumb
          segments={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Chat", href: "/dashboard/chat" },
            { label: "Unavailable" },
          ]}
        />
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>Conversation unavailable</EmptyTitle>
            <EmptyDescription>
              This chat was deleted or no longer exists.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/dashboard/chat">Start a new chat</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </>
    );
  }

  return (
    <>
      <AppBreadcrumb
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Chat", href: "/dashboard/chat" },
          { label: threadData?.thread.title ?? "New chat" },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
        {/* Model toolbar */}
        <div className="flex items-center justify-end gap-2 border-b px-3 py-2">
          <ChatModelSelector
            models={models}
            value={activeModel}
            loading={modelsLoading && models.length === 0}
            saving={updatePreferences.isPending}
            onSelect={handleSelectModel}
          />
        </div>

        {/* Messages area */}
        <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
          <MessageScroller className="min-h-0 flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent className="gap-4 p-4">
                {!threadLoading && messages.length === 0 && (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Ask me anything.
                    </p>
                  </div>
                )}

                {messagesWithTime.map((m, index) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    modelId={
                      m.role === "assistant"
                        ? modelForMessage(index)
                        : undefined
                    }
                    labelForModel={labelForModel}
                  >
                    {m.role === "assistant" ? (
                      <MessageFeedback threadId={threadId} messageId={m.id} />
                    ) : null}
                  </ChatMessage>
                ))}

                {isStreaming && messages.length > 0 && (
                  <MessageScrollerItem className="flex items-start">
                    <span className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                      Assistant
                    </span>
                    <span className="ml-2 animate-pulse text-sm">▍</span>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Input area */}
        <ChatComposer
          isStreaming={isStreaming}
          attachmentsEnabled={!!threadData && !threadData.thread.agentId}
          onSend={handleSend}
          onStop={stop}
        />
      </div>
    </>
  );
}
