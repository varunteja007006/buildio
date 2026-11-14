"use client";

import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@workspace/ui/components/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@workspace/ui/components/message";

export function BubbleDemo() {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-md border bg-muted/30 p-4">
      <BubbleGroup className="mx-auto w-full max-w-xs">
        <Bubble variant="secondary" align="start">
          <BubbleContent>Hey! Is the extras section ready?</BubbleContent>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>Just shipped it — dragging works too.</BubbleContent>
          <BubbleReactions side="bottom" align="end">
            🔥 3
          </BubbleReactions>
        </Bubble>
        <Bubble variant="tinted" align="start">
          <BubbleContent>Nice 🎉 Checking it now.</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}

export function MessageDemo() {
  return (
    <MessageGroup className="w-full">
      <Message align="start">
        <MessageAvatar className="size-8 text-xs font-medium">
          AK
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Ava Kim · 10:24</MessageHeader>
          <div className="w-fit max-w-[80%] rounded-xl border bg-muted/50 px-3 py-2 leading-relaxed">
            Can you review the extras showcase PR today?
          </div>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar className="size-8 text-xs font-medium">V</MessageAvatar>
        <MessageContent>
          <MessageHeader>You · 10:26</MessageHeader>
          <div className="w-fit max-w-[80%] self-end rounded-xl bg-primary px-3 py-2 text-primary-foreground leading-relaxed">
            On it — finishing the sortable demo first.
          </div>
          <MessageFooter>Seen 10:27</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  );
}
