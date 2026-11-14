"use client";

import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@workspace/ui/components/trace";
import {
  LoaderCircleIcon,
  SearchIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";


export function TraceDemo() {
  return (
    <div className="h-64 overflow-y-auto rounded-lg border bg-background p-3">
      <Trace>
        <TraceLine>
          <TraceIcon>
            <SearchIcon />
          </TraceIcon>
          <TraceTitle>Searching documents</TraceTitle>
          <TraceDescription>12 sources</TraceDescription>
        </TraceLine>

        <TraceCollapsible defaultOpen>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceIcon>
                <SparklesIcon />
              </TraceIcon>
              <TraceTitle>Generating answer</TraceTitle>
              <TraceDescription>3.2s</TraceDescription>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <TraceLine status="running">
              <TraceIcon>
                <LoaderCircleIcon className="animate-spin" />
              </TraceIcon>
              <TraceTitle>Streaming tokens…</TraceTitle>
            </TraceLine>
            <p className="mt-2 text-sm">
              Composed the reply from 4 retrieved chunks.
            </p>
          </TraceCollapsibleContent>
        </TraceCollapsible>

        <TraceCollapsible>
          <TraceCollapsibleTrigger>
            <TraceLine status="error">
              <TraceIcon>
                <WrenchIcon />
              </TraceIcon>
              <TraceTitle>Tool call: get_weather</TraceTitle>
              <TraceDescription>failed</TraceDescription>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <p className="text-sm">
              Rate limit exceeded (429). Retried once, then gave up.
            </p>
          </TraceCollapsibleContent>
        </TraceCollapsible>

        <TraceLine status="pending">
          <TraceIcon>•</TraceIcon>
          <TraceTitle>Waiting for user confirmation</TraceTitle>
        </TraceLine>
      </Trace>
    </div>
  );
}
