"use client";

/**
 * AI Elements section — agent chat UI building blocks from
 * packages/ui/src/components/ai-elements. All demos render statically:
 * no streaming, no network calls, no API keys.
 */

import {
  ConversationDemo,
  ConversationEmptyStateDemo,
} from "@/components/showcase/ai-elements/conversation-demo";
import { MessageDemo } from "@/components/showcase/ai-elements/message-demo";
import { PromptInputDemo } from "@/components/showcase/ai-elements/prompt-input-demo";
import {
  ChainOfThoughtDemo,
  ReasoningDemo,
} from "@/components/showcase/ai-elements/reasoning-demo";
import {
  ShimmerDemo,
  SourcesDemo,
  SuggestionDemo,
  TaskDemo,
} from "@/components/showcase/ai-elements/task-demo";
import {
  AiCodeBlockDemo,
  ToolDemo,
} from "@/components/showcase/ai-elements/tool-demo";
import { Example, Section } from "@/components/showcase/section";

export function AiElementsSection() {
  return (
    <Section
      title="AI Elements"
      description="Agent chat building blocks: conversation shells, messages with branches, reasoning traces, tool calls, sources and prompt suggestions. All static demos."
    >
      <Example
        title="Conversation"
        description="Scrollable chat shell with stick-to-bottom scrolling, scroll button and markdown transcript download."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <ConversationDemo />
      </Example>

      <Example
        title="ConversationEmptyState"
        description="Placeholder shown before the first message."
        contentClassName="flex-col items-stretch"
      >
        <ConversationEmptyStateDemo />
      </Example>

      <Example
        title="Message"
        description="Role-styled bubbles, action buttons with tooltips and a branch selector between alternate responses."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <MessageDemo />
      </Example>

      <Example
        title="Prompt Input"
        description="Prompt composer with attachment menu, model select, tool toggles with tooltips and a status-aware submit button; submitting toasts the captured message."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <PromptInputDemo />
      </Example>

      <Example
        title="Reasoning"
        description="Collapsible thinking trace with duration label; open by default here."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <ReasoningDemo />
      </Example>

      <Example
        title="ChainOfThought"
        description="Step-by-step plan with status icons, search-result badges and a collapsible body."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <ChainOfThoughtDemo />
      </Example>

      <Example
        title="Task"
        description="Collapsible agent task list with file chips."
        contentClassName="items-start"
      >
        <TaskDemo />
      </Example>

      <Example
        title="Tool"
        description="Tool call cards with status badges and JSON parameter/result blocks."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <ToolDemo />
      </Example>

      <Example title="Sources" description="Collapsible list of cited links.">
        <SourcesDemo />
      </Example>

      <Example
        title="Suggestion"
        description="Horizontally scrolling prompt chips; click tracks the pick below."
        contentClassName="items-start"
      >
        <SuggestionDemo />
      </Example>

      <Example
        title="Shimmer"
        description="Animated placeholder text while a response loads."
        contentClassName="items-start"
      >
        <ShimmerDemo />
      </Example>

      <Example
        title="CodeBlock (ai-elements)"
        description="Shiki-highlighted variant with language-aware themes and line numbers — a different family from the Content section CodeBlock."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <AiCodeBlockDemo />
      </Example>
    </Section>
  );
}
