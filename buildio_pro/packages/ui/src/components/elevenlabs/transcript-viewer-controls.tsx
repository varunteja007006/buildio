"use client";

import { Pause, Play } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import {
  ScrubBarContainer,
  ScrubBarProgress,
  ScrubBarThumb,
  ScrubBarTimeLabel,
  ScrubBarTrack,
} from "./scrub-bar.js";
import { useTranscriptViewerContext } from "./transcript-viewer-context.js";

function TranscriptViewerAudio({
  ...props
}: ComponentPropsWithoutRef<"audio">) {
  const { audioProps } = useTranscriptViewerContext();
  return (
    <audio
      data-slot="transcript-audio"
      {...audioProps}
      {...props}
      ref={audioProps.ref}
    />
  );
}

type RenderChildren = (state: { isPlaying: boolean }) => ReactNode;

type TranscriptViewerPlayPauseButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "children"
> & {
  children?: ReactNode | RenderChildren;
};

function TranscriptViewerPlayPauseButton({
  className,
  children,
  onClick,
  ...props
}: TranscriptViewerPlayPauseButtonProps) {
  const { isPlaying, play, pause } = useTranscriptViewerContext();
  const Icon = isPlaying ? Pause : Play;

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (isPlaying) pause();
    else play();
    onClick?.(event);
  };

  const content =
    typeof children === "function"
      ? (children as RenderChildren)({ isPlaying })
      : children;

  return (
    <Button
      data-slot="transcript-play-pause-button"
      type="button"
      variant="outline"
      size="icon"
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
      data-playing={isPlaying}
      className={cn("cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    >
      {content ?? <Icon className="size-5" />}
    </Button>
  );
}

type TranscriptViewerScrubBarProps = Omit<
  ComponentPropsWithoutRef<typeof ScrubBarContainer>,
  "duration" | "value" | "onScrub" | "onScrubStart" | "onScrubEnd"
> & {
  showTimeLabels?: boolean;
  labelsClassName?: string;
  trackClassName?: string;
  progressClassName?: string;
  thumbClassName?: string;
};

/**
 * A context-aware implementation of the scrub bar specific to the transcript
 * viewer.
 */
function TranscriptViewerScrubBar({
  className,
  showTimeLabels = true,
  labelsClassName,
  trackClassName,
  progressClassName,
  thumbClassName,
  ...props
}: TranscriptViewerScrubBarProps) {
  const { duration, currentTime, seekToTime, startScrubbing, endScrubbing } =
    useTranscriptViewerContext();
  return (
    <ScrubBarContainer
      data-slot="transcript-scrub-bar"
      duration={duration}
      value={currentTime}
      onScrubStart={startScrubbing}
      onScrubEnd={endScrubbing}
      onScrub={seekToTime}
      className={className}
      {...props}
    >
      <div className="flex flex-1 flex-col gap-1">
        <ScrubBarTrack className={trackClassName}>
          <ScrubBarProgress className={progressClassName} />
          <ScrubBarThumb className={thumbClassName} />
        </ScrubBarTrack>
        {showTimeLabels && (
          <div
            className={cn(
              "text-muted-foreground flex items-center justify-between text-xs",
              labelsClassName,
            )}
          >
            <ScrubBarTimeLabel time={currentTime} />
            <ScrubBarTimeLabel time={duration - currentTime} />
          </div>
        )}
      </div>
    </ScrubBarContainer>
  );
}

export {
  TranscriptViewerAudio,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
};
