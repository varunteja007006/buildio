"use client";

import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";

import { useBarAnimator } from "./bar-visualizer-animation.js";
import { useMultibandVolume } from "./bar-visualizer-audio.js";
import type { AgentState, BarVisualizerProps } from "./bar-visualizer-types.js";

function Bar({
  heightPct,
  isHighlighted,
  state,
}: {
  heightPct: number;
  isHighlighted: boolean;
  state?: AgentState;
}) {
  return (
    <div
      data-highlighted={isHighlighted}
      className={cn(
        "max-w-[12px] min-w-[8px] flex-1 rounded-full transition-all duration-150",
        "bg-border data-[highlighted=true]:bg-primary",
        state === "speaking" && "bg-primary",
        state === "thinking" && isHighlighted && "animate-pulse",
      )}
      style={{
        height: `${heightPct}%`,
        animationDuration: state === "thinking" ? "300ms" : undefined,
      }}
    />
  );
}

const MemoizedBar = memo(Bar);

const BarVisualizerComponent = forwardRef<HTMLDivElement, BarVisualizerProps>(
  (
    {
      state,
      barCount = 15,
      mediaStream,
      minHeight = 20,
      maxHeight = 100,
      demo = false,
      centerAlign = false,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const realVolumeBands = useMultibandVolume(mediaStream, {
      bands: barCount,
      loPass: 100,
      hiPass: 200,
    });
    const fakeVolumeBandsRef = useRef<number[]>(new Array(barCount).fill(0.2));
    const [fakeVolumeBands, setFakeVolumeBands] = useState<number[]>(() =>
      new Array(barCount).fill(0.2),
    );
    const fakeAnimationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
      if (!demo) return;
      if (state !== "speaking" && state !== "listening") {
        const bands = new Array(barCount).fill(0.2);
        fakeVolumeBandsRef.current = bands;
        setFakeVolumeBands(bands);
        return;
      }

      let lastUpdate = 0;
      const startTime = Date.now() / 1000;
      const updateFakeVolume = (timestamp: number) => {
        if (timestamp - lastUpdate >= 50) {
          const time = Date.now() / 1000 - startTime;
          const nextBands = Array.from({ length: barCount }, (_, index) => {
            const base = Math.sin(time * 2 + index * 0.5) * 0.3 + 0.5;
            return Math.max(0.1, Math.min(1, base + Math.random() * 0.2));
          });

          if (
            nextBands.some(
              (value, index) =>
                Math.abs(value - (fakeVolumeBandsRef.current[index] ?? 0.2)) >
                0.05,
            )
          ) {
            fakeVolumeBandsRef.current = nextBands;
            setFakeVolumeBands(nextBands);
          }
          lastUpdate = timestamp;
        }
        fakeAnimationRef.current = requestAnimationFrame(updateFakeVolume);
      };

      fakeAnimationRef.current = requestAnimationFrame(updateFakeVolume);
      return () => {
        if (fakeAnimationRef.current !== undefined) {
          cancelAnimationFrame(fakeAnimationRef.current);
        }
      };
    }, [demo, state, barCount]);

    const volumeBands = useMemo(
      () => (demo ? fakeVolumeBands : realVolumeBands),
      [demo, fakeVolumeBands, realVolumeBands],
    );
    const highlightedIndices = useBarAnimator(
      state,
      barCount,
      state === "connecting"
        ? 2000 / barCount
        : state === "thinking"
          ? 150
          : state === "listening"
            ? 500
            : 1000,
    );

    return (
      <div
        ref={ref}
        data-state={state}
        className={cn(
          "relative flex justify-center gap-1.5",
          centerAlign ? "items-center" : "items-end",
          "bg-muted h-32 w-full overflow-hidden rounded-lg p-4",
          className,
        )}
        style={style}
        {...props}
      >
        {volumeBands.map((volume, index) => (
          <MemoizedBar
            key={index}
            heightPct={Math.min(
              maxHeight,
              Math.max(minHeight, volume * 100 + 5),
            )}
            isHighlighted={highlightedIndices.includes(index)}
            state={state}
          />
        ))}
      </div>
    );
  },
);

BarVisualizerComponent.displayName = "BarVisualizerComponent";

export const BarVisualizer = memo(BarVisualizerComponent);
BarVisualizer.displayName = "BarVisualizer";

export { useBarAnimator } from "./bar-visualizer-animation.js";
export {
  useAudioVolume,
  useMultibandVolume,
  type AudioAnalyserOptions,
  type MultiBandVolumeOptions,
} from "./bar-visualizer-audio.js";
export type { AgentState, BarVisualizerProps } from "./bar-visualizer-types.js";
