"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";

import { useLiveMicrophoneDrag } from "./use-live-microphone-drag.js";
import { useLiveMicrophonePlayback } from "./use-live-microphone-playback.js";
import { useLiveMicrophoneRecorder } from "./use-live-microphone-recorder.js";
import { useLiveMicrophoneRender } from "./use-live-microphone-render.js";
import { heightToStyle, observeCanvasResize } from "./waveform-canvas.js";
import type { ScrollingWaveformProps } from "./waveform-scrolling.js";

export type LiveMicrophoneWaveformProps = Omit<
  ScrollingWaveformProps,
  "barCount"
> & {
  active?: boolean;
  fftSize?: number;
  smoothingTimeConstant?: number;
  sensitivity?: number;
  onError?: (error: Error) => void;
  historySize?: number;
  updateRate?: number;
  savedHistoryRef?: React.MutableRefObject<number[]>;
  dragOffset?: number;
  setDragOffset?: (offset: number) => void;
  enableAudioPlayback?: boolean;
  playbackRate?: number;
};

export const LiveMicrophoneWaveform = ({
  active = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  historySize = 150,
  updateRate = 50,
  barWidth = 3,
  barHeight: baseBarHeight = 4,
  barGap = 1,
  barRadius = 1,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  className,
  savedHistoryRef,
  dragOffset: externalDragOffset,
  setDragOffset: externalSetDragOffset,
  enableAudioPlayback = true,
  playbackRate = 1,
  ...props
}: LiveMicrophoneWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalHistoryRef = useRef<number[]>([]);
  const historyRef = savedHistoryRef || internalHistoryRef;
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const scrubSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [internalDragOffset, setInternalDragOffset] = useState(0);

  // Use external drag state if provided, otherwise use internal
  const dragOffset = externalDragOffset ?? internalDragOffset;
  const setDragOffset = externalSetDragOffset ?? setInternalDragOffset;

  const heightStyle = heightToStyle(height);

  const {
    playbackPosition,
    setPlaybackPosition,
    playScrubSound,
    playFromPosition,
    stopScrub,
  } = useLiveMicrophonePlayback({
    enableAudioPlayback,
    playbackRate,
    barWidth,
    barGap,
    containerRef,
    historyRef,
    setDragOffset,
    audioContextRef,
    audioBufferRef,
    sourceNodeRef,
    scrubSourceRef,
  });

  const onReset = useCallback(() => {
    setPlaybackPosition(null);
  }, [setPlaybackPosition]);

  useLiveMicrophoneRecorder({
    active,
    fftSize,
    smoothingTimeConstant,
    enableAudioPlayback,
    onError,
    onReset,
    historyRef,
    setDragOffset,
    analyserRef,
    audioContextRef,
    streamRef,
    mediaRecorderRef,
    audioChunksRef,
    audioBufferRef,
    sourceNodeRef,
    scrubSourceRef,
  });

  useLiveMicrophoneRender({
    active,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    dragOffset,
    playbackPosition,
    historyRef,
    analyserRef,
    canvasRef,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    return observeCanvasResize(canvas, container);
  }, []);

  const { handleMouseDown } = useLiveMicrophoneDrag({
    active,
    barWidth,
    barGap,
    historyRef,
    canvasRef,
    dragOffset,
    setDragOffset,
    enableAudioPlayback,
    audioBufferRef,
    playScrubSound,
    playFromPosition,
    stopScrub,
  });

  return (
    <div
      className={cn(
        "relative flex items-center",
        !active && historyRef.current.length > 0 && "cursor-pointer",
        className,
      )}
      onMouseDown={handleMouseDown}
      ref={containerRef}
      role={!active && historyRef.current.length > 0 ? "slider" : undefined}
      aria-label={
        !active && historyRef.current.length > 0
          ? "Drag to scrub through recording"
          : undefined
      }
      aria-valuenow={
        !active && historyRef.current.length > 0
          ? Math.abs(dragOffset)
          : undefined
      }
      aria-valuemin={!active && historyRef.current.length > 0 ? 0 : undefined}
      aria-valuemax={
        !active && historyRef.current.length > 0
          ? historyRef.current.length
          : undefined
      }
      tabIndex={!active && historyRef.current.length > 0 ? 0 : undefined}
      style={{ height: heightStyle }}
      {...props}
    >
      <canvas className="block h-full w-full" ref={canvasRef} />
    </div>
  );
};
