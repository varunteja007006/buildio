"use client";

/**
 * Message demo — the ai-elements Message family: role-styled bubbles,
 * action buttons with tooltips, and a branch selector between alternate
 * responses. Static content, no streaming.
 */

import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
} from "@workspace/ui/components/ai-elements/message";
import { CopyIcon, RefreshCwIcon } from "lucide-react";


export function MessageDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Message from="user">
        <MessageContent>How do I add a tool to my agent?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          Register the handler in the tool registry and mention it in the
          system prompt so the model knows when to call it.
        </MessageContent>
        <MessageActions>
          <MessageAction label="Copy message" tooltip="Copy">
            <CopyIcon className="size-3.5" />
          </MessageAction>
          <MessageAction label="Regenerate response" tooltip="Regenerate">
            <RefreshCwIcon className="size-3.5" />
          </MessageAction>
        </MessageActions>
      </Message>
      <MessageBranch defaultBranch={1}>
        <MessageBranchContent>
          <Message from="assistant" key="branch-a">
            <MessageContent>Branch A: a concise answer.</MessageContent>
          </Message>
          <Message from="assistant" key="branch-b">
            <MessageContent>Branch B: a longer, more detailed answer.</MessageContent>
          </Message>
        </MessageBranchContent>
        <MessageBranchSelector>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </MessageBranch>
    </div>
  );
}
