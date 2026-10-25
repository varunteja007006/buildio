"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import {
  useAudioPlayer,
  type AudioPlayerItem,
} from "./audio-player-context.js";

interface SpinnerProps {
  className?: string;
}

function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-muted border-t-foreground size-3.5 animate-spin rounded-full border-2",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface PlayButtonProps extends ComponentProps<typeof Button> {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  loading?: boolean;
}

const PlayButton = ({
  playing,
  onPlayingChange,
  className,
  onClick,
  loading,
  ...otherProps
}: PlayButtonProps) => {
  return (
    <Button
      {...otherProps}
      onClick={(e) => {
        onPlayingChange(!playing);
        onClick?.(e);
      }}
      className={cn("relative", className)}
      aria-label={playing ? "Pause" : "Play"}
      type="button"
    >
      {playing ? (
        <PauseIcon
          className={cn("size-4", loading && "opacity-0")}
          aria-hidden="true"
        />
      ) : (
        <PlayIcon
          className={cn("size-4", loading && "opacity-0")}
          aria-hidden="true"
        />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] backdrop-blur-xs">
          <Spinner />
        </div>
      )}
    </Button>
  );
};

export interface AudioPlayerButtonProps<TData = unknown> extends ComponentProps<
  typeof Button
> {
  item?: AudioPlayerItem<TData>;
}

export function AudioPlayerButton<TData = unknown>({
  item,
  ...otherProps
}: AudioPlayerButtonProps<TData>) {
  const player = useAudioPlayer<TData>();

  if (!item) {
    return (
      <PlayButton
        {...otherProps}
        playing={player.isPlaying}
        onPlayingChange={(shouldPlay) => {
          if (shouldPlay) {
            player.play();
          } else {
            player.pause();
          }
        }}
        loading={player.isBuffering && player.isPlaying}
      />
    );
  }

  return (
    <PlayButton
      {...otherProps}
      playing={player.isItemActive(item.id) && player.isPlaying}
      onPlayingChange={(shouldPlay) => {
        if (shouldPlay) {
          player.play(item);
        } else {
          player.pause();
        }
      }}
      loading={
        player.isItemActive(item.id) && player.isBuffering && player.isPlaying
      }
    />
  );
}
