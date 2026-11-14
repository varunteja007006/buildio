"use client";

/**
 * Reasoning + chain-of-thought demos — collapsible thinking trace and
 * step-by-step plan. Static content, no streaming.
 */


import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@workspace/ui/components/ai-elements/chain-of-thought";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@workspace/ui/components/ai-elements/reasoning";
import { GlobeIcon, SearchIcon } from "lucide-react";

export function ReasoningDemo() {
  return (
    <Reasoning defaultOpen duration={3}>
      <ReasoningTrigger />
      <ReasoningContent>
        {`The user wants to know how tool results stream back.

- Check the tool registry for partial-output support
- Confirm the status badge maps to the tool state
- Summarize with a short example`}
      </ReasoningContent>
    </Reasoning>
  );
}

export function ChainOfThoughtDemo() {
  return (
    <ChainOfThought defaultOpen>
      <ChainOfThoughtHeader>Planning the deployment</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <ChainOfThoughtStep
          description="Found 3 references to the payments tool."
          icon={SearchIcon}
          label="Searching the codebase"
          status="complete"
        />
        <ChainOfThoughtStep
          description="Collecting changelog entries for v2.4."
          icon={GlobeIcon}
          label="Fetching release notes"
          status="active"
        />
        <ChainOfThoughtSearchResults>
          <ChainOfThoughtSearchResult>convex docs</ChainOfThoughtSearchResult>
          <ChainOfThoughtSearchResult>next.js routing</ChainOfThoughtSearchResult>
        </ChainOfThoughtSearchResults>
        <ChainOfThoughtStep
          description="Pending user approval."
          label="Writing the migration"
          status="pending"
        />
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
