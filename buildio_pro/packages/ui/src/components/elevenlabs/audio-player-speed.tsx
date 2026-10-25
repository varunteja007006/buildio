"use client";

import { Check, Settings } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";

import { useAudioPlayer } from "./audio-player-context.js";

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export interface AudioPlayerSpeedProps extends ComponentProps<typeof Button> {
  speeds?: readonly number[];
}

export function AudioPlayerSpeed({
  speeds = PLAYBACK_SPEEDS,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: AudioPlayerSpeedProps) {
  const player = useAudioPlayer();
  const currentSpeed = player.playbackRate;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(className)}
          aria-label="Playback speed"
          {...props}
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {speeds.map((speed) => (
          <DropdownMenuItem
            key={speed}
            onClick={() => player.setPlaybackRate(speed)}
            className="flex items-center justify-between"
          >
            <span className={speed === 1 ? "" : "font-mono"}>
              {speed === 1 ? "Normal" : `${speed}x`}
            </span>
            {currentSpeed === speed && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface AudioPlayerSpeedButtonGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  speeds?: readonly number[];
}

export function AudioPlayerSpeedButtonGroup({
  speeds = [0.5, 1, 1.5, 2],
  className,
  ...props
}: AudioPlayerSpeedButtonGroupProps) {
  const player = useAudioPlayer();
  const currentSpeed = player.playbackRate;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label="Playback speed controls"
      {...props}
    >
      {speeds.map((speed) => (
        <Button
          key={speed}
          variant={currentSpeed === speed ? "default" : "outline"}
          size="sm"
          onClick={() => player.setPlaybackRate(speed)}
          className="min-w-[50px] font-mono text-xs"
        >
          {speed}x
        </Button>
      ))}
    </div>
  );
}
