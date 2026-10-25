import { useEffect, useMemo, useRef, useState } from "react";

import type { AgentState } from "./bar-visualizer-types.js";

export function useBarAnimator(
  state: AgentState | undefined,
  columns: number,
  interval: number,
) {
  const indexRef = useRef(0);
  const [currentFrame, setCurrentFrame] = useState<number[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);
  const sequence = useMemo(() => {
    if (state === "thinking" || state === "listening") {
      return [[Math.floor(columns / 2)], [-1]];
    }
    if (state === "connecting" || state === "initializing") {
      return Array.from({ length: columns }, (_, index) => [
        index,
        columns - 1 - index,
      ]);
    }
    return [Array.from({ length: columns }, (_, index) => index)];
  }, [state, columns]);

  useEffect(() => {
    indexRef.current = 0;
    setCurrentFrame(sequence[0] ?? []);
  }, [sequence]);

  useEffect(() => {
    let startTime = performance.now();
    const animate = (time: number) => {
      if (time - startTime >= interval) {
        indexRef.current = (indexRef.current + 1) % sequence.length;
        setCurrentFrame(sequence[indexRef.current] ?? []);
        startTime = time;
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current !== undefined) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [interval, sequence]);

  return currentFrame;
}
