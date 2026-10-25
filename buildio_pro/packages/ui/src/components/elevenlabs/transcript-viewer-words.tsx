"use client";

import { useMemo, type HTMLAttributes, type ReactNode } from "react";

import {
  type TranscriptSegment,
  type TranscriptWord as TranscriptWordType,
} from "@workspace/ui/hooks/use-transcript-viewer";
import { cn } from "@workspace/ui/lib/utils";

import { useTranscriptViewerContext } from "./transcript-viewer-context.js";

type TranscriptGap = Extract<TranscriptSegment, { kind: "gap" }>;

type TranscriptViewerWordStatus = "spoken" | "unspoken" | "current";

interface TranscriptViewerWordProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  word: TranscriptWordType;
  status: TranscriptViewerWordStatus;
  children?: ReactNode;
}

function TranscriptViewerWord({
  word,
  status,
  className,
  children,
  ...props
}: TranscriptViewerWordProps) {
  return (
    <span
      data-slot="transcript-word"
      data-kind="word"
      data-status={status}
      className={cn(
        "rounded-sm px-0.5 transition-colors",
        status === "spoken" && "text-foreground",
        status === "unspoken" && "text-muted-foreground",
        status === "current" && "bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    >
      {children ?? word.text}
    </span>
  );
}

interface TranscriptViewerWordsProps extends HTMLAttributes<HTMLDivElement> {
  renderWord?: (props: {
    word: TranscriptWordType;
    status: TranscriptViewerWordStatus;
  }) => ReactNode;
  renderGap?: (props: {
    segment: TranscriptGap;
    status: TranscriptViewerWordStatus;
  }) => ReactNode;
  wordClassNames?: string;
  gapClassNames?: string;
}

function TranscriptViewerWords({
  className,
  renderWord,
  renderGap,
  wordClassNames,
  gapClassNames,
  ...props
}: TranscriptViewerWordsProps) {
  const {
    spokenSegments,
    unspokenSegments,
    currentWord,
    segments,
    duration,
    currentTime,
  } = useTranscriptViewerContext();

  const nearEnd = useMemo(() => {
    if (!duration) return false;
    return currentTime >= duration - 0.01;
  }, [currentTime, duration]);

  const segmentsWithStatus = useMemo(() => {
    if (nearEnd) {
      return segments.map((segment) => ({
        segment,
        status: "spoken" as const,
      }));
    }

    const entries: Array<{
      segment: TranscriptSegment;
      status: TranscriptViewerWordStatus;
    }> = [];

    for (const segment of spokenSegments) {
      entries.push({ segment, status: "spoken" });
    }

    if (currentWord) {
      entries.push({ segment: currentWord, status: "current" });
    }

    for (const segment of unspokenSegments) {
      entries.push({ segment, status: "unspoken" });
    }

    return entries;
  }, [spokenSegments, unspokenSegments, currentWord, nearEnd, segments]);

  return (
    <div
      data-slot="transcript-words"
      className={cn("text-xl leading-relaxed", className)}
      {...props}
    >
      {segmentsWithStatus.map(({ segment, status }) => {
        if (segment.kind === "gap") {
          const content = renderGap
            ? renderGap({ segment, status })
            : segment.text;
          return (
            <span
              key={`gap-${segment.segmentIndex}`}
              data-kind="gap"
              data-status={status}
              className={cn(gapClassNames)}
            >
              {content}
            </span>
          );
        }

        if (renderWord) {
          return (
            <span
              key={`word-${segment.segmentIndex}`}
              data-kind="word"
              data-status={status}
              className={cn(wordClassNames)}
            >
              {renderWord({ word: segment, status })}
            </span>
          );
        }

        return (
          <TranscriptViewerWord
            key={`word-${segment.segmentIndex}`}
            word={segment}
            status={status}
            className={wordClassNames}
          />
        );
      })}
    </div>
  );
}

export { TranscriptViewerWord, TranscriptViewerWords };
