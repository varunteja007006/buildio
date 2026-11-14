"use client";

import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@workspace/ui/components/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@workspace/ui/components/message-scroller";
import { cn } from "@workspace/ui/lib/utils";

type DemoMessage = {
  author: string;
  initials: string;
  text: string;
  time: string;
  align: "start" | "end";
};

const demoMessages: DemoMessage[] = [
  {
    author: "Ava Kim",
    initials: "AK",
    text: "Morning! Standup notes are in the doc.",
    time: "09:12",
    align: "start",
  },
  {
    author: "You",
    initials: "V",
    text: "Thanks — adding the extras section today.",
    time: "09:14",
    align: "end",
  },
  {
    author: "Ava Kim",
    initials: "AK",
    text: "Perfect. The faceted filter popover still needs a review pass.",
    time: "09:15",
    align: "start",
  },
  {
    author: "You",
    initials: "V",
    text: "I'll take that after the sortable list.",
    time: "09:16",
    align: "end",
  },
  {
    author: "Ava Kim",
    initials: "AK",
    text: "Also: the attachment chips look great in dark mode.",
    time: "09:18",
    align: "start",
  },
  {
    author: "You",
    initials: "V",
    text: "Shipping the demo page this afternoon 🚀",
    time: "09:20",
    align: "end",
  },
];

export function MessageScrollerDemo() {
  return (
    <div className="relative h-72 overflow-hidden rounded-md border bg-background">
      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
        <MessageScroller className="h-full">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-5 p-4">
              {demoMessages.map((message, index) => (
                <MessageScrollerItem
                  key={message.time}
                  scrollAnchor={index === demoMessages.length - 1}
                >
                  <Message align={message.align}>
                    <MessageAvatar className="size-8 self-start text-xs font-medium">
                      {message.initials}
                    </MessageAvatar>
                    <MessageContent>
                      <MessageHeader>
                        {message.author} · {message.time}
                      </MessageHeader>
                      <div
                        className={cn(
                          "w-fit max-w-[80%] rounded-xl px-3 py-2 leading-relaxed wrap-break-word",
                          message.align === "end"
                            ? "self-end bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {message.text}
                      </div>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
