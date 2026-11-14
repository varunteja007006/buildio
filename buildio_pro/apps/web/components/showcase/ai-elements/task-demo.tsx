"use client";

/**
 * Task list, sources, suggestion chips and shimmer demos — all static,
 * no network calls or AI runtime.
 */


import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@workspace/ui/components/ai-elements/sources";
import {
  Suggestion,
  Suggestions,
} from "@workspace/ui/components/ai-elements/suggestion";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@workspace/ui/components/ai-elements/task";
import { useState } from "react";

export function TaskDemo() {
  return (
    <div className="w-full space-y-3">
      <Task defaultOpen>
        <TaskTrigger title="Searched the codebase for tool registries" />
        <TaskContent>
          <TaskItem>
            Read packages/ui/src/components/ai-elements/tool.tsx
          </TaskItem>
          <TaskItem className="flex flex-wrap items-center gap-1">
            Matched 3 files
            <TaskItemFile>tool.tsx</TaskItemFile>
            <TaskItemFile>registry.ts</TaskItemFile>
          </TaskItem>
        </TaskContent>
      </Task>
      <Task defaultOpen={false}>
        <TaskTrigger title="Drafted release notes" />
        <TaskContent>
          <TaskItem>Collected changelog entries for v2.4.</TaskItem>
        </TaskContent>
      </Task>
    </div>
  );
}

export function SourcesDemo() {
  return (
    <Sources>
      <SourcesTrigger count={2} />
      <SourcesContent>
        <Source href="https://convex.dev/docs" title="Convex docs" />
        <Source href="https://nextjs.org/docs" title="Next.js docs" />
      </SourcesContent>
    </Sources>
  );
}

export function SuggestionDemo() {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="w-full space-y-2">
      <Suggestions>
        <Suggestion onClick={setPicked} suggestion="Summarize this PR" />
        <Suggestion onClick={setPicked} suggestion="Write release notes" />
        <Suggestion onClick={setPicked} suggestion="Explain the schema" />
      </Suggestions>
      <p className="text-muted-foreground text-xs">
        {picked ? `Picked: ${picked}` : "Click a prompt chip."}
      </p>
    </div>
  );
}

export function ShimmerDemo() {
  return (
    <div className="w-full space-y-1">
      <Shimmer className="text-sm">Thinking…</Shimmer>
      <Shimmer className="text-sm" duration={3}>
        Generating response…
      </Shimmer>
    </div>
  );
}
