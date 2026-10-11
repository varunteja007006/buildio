import { createUIMessageStream } from "ai";

import { GUARDRAIL_REFUSAL } from "@/lib/chat/guardrail";

export function buildRefusalStream(messageId: string) {
  return createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "start", messageId });
      writer.write({ type: "text-start", id: messageId });
      writer.write({
        type: "text-delta",
        id: messageId,
        delta: GUARDRAIL_REFUSAL,
      });
      writer.write({ type: "text-end", id: messageId });
      writer.write({ type: "finish", finishReason: "content-filter" });
    },
  });
}
