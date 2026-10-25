"use client";

import { useEffect, useRef } from "react";

import { cn } from "@workspace/ui/lib/utils";

import { useMicrophoneStream } from "./live-waveform-audio.js";
import { useProcessingTransition } from "./live-waveform-processing.js";
import { useWaveformRenderer } from "./live-waveform-render.js";
import type { LiveWaveformProps } from "./live-waveform-types.js";

export type { LiveWaveformProps } from "./live-waveform-types.js";

export const LiveWaveform = ({
  active = false,
  processing = false,
  deviceId,
  barWidth = 3,
  barGap = 1,
  barRadius = 1.5,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  barHeight: baseBarHeight = 4,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 60,
  updateRate = 30,
  mode = "static",
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  ...props
}: LiveWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<number[]>([]);
  const staticBarsRef = useRef<number[]>([]);
  const lastActiveDataRef = useRef<number[]>([]);
  const needsRedrawRef = useRef(true);
  const gradientCacheRef = useRef<CanvasGradient | null>(null);
  const lastWidthRef = useRef(0);

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useProcessingTransition({
    active,
    processing,
    barWidth,
    barGap,
    mode,
    containerRef,
    historyRef,
    staticBarsRef,
    lastActiveDataRef,
    needsRedrawRef,
  });

  const { analyserRef } = useMicrophoneStream({
    active,
    deviceId,
    fftSize,
    smoothingTimeConstant,
    historyRef,
    onError,
    onStreamReady,
    onStreamEnd,
  });

  useWaveformRenderer({
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    barHeight: baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
    canvasRef,
    analyserRef,
    historyRef,
    staticBarsRef,
    lastActiveDataRef,
    needsRedrawRef,
    gradientCacheRef,
    lastWidthRef,
  });

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={
        active
          ? "Live audio waveform"
          : processing
            ? "Processing audio"
            : "Audio waveform idle"
      }
      role="img"
      {...props}
    >
      {!active && !processing && (
        <div className="border-muted-foreground/20 absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t-2 border-dotted" />
      )}
      <canvas
        className="block h-full w-full"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  );
};
