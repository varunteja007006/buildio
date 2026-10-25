"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export type LiveMicrophoneDragOptions = {
  active: boolean;
  barWidth: number;
  barGap: number;
  historyRef: RefObject<number[]>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  dragOffset: number;
  setDragOffset?: (offset: number) => void;
  enableAudioPlayback: boolean;
  audioBufferRef: RefObject<AudioBuffer | null>;
  playScrubSound: (position: number, direction: number) => void;
  playFromPosition: (position: number) => void;
  stopScrub: () => void;
};

export function useLiveMicrophoneDrag(options: LiveMicrophoneDragOptions) {
  const {
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
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;

    let lastScrubTime = 0;
    let lastMouseX = dragStartXRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const newOffset = dragStartOffsetRef.current - deltaX * 0.5; // Reduce sensitivity

      const step = barWidth + barGap;
      const maxBars = historyRef.current.length;
      const viewWidth = canvasRef.current?.getBoundingClientRect().width || 0;
      const viewBars = Math.floor(viewWidth / step);

      const maxOffset = Math.max(0, (maxBars - viewBars) * step);
      const minOffset = 0;
      const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));

      setDragOffset?.(clampedOffset);

      const now = Date.now();
      if (
        enableAudioPlayback &&
        audioBufferRef.current &&
        now - lastScrubTime > 50
      ) {
        lastScrubTime = now;
        const offsetBars = Math.floor(clampedOffset / step);
        const rightmostBarIndex = Math.max(
          0,
          Math.min(maxBars - 1, maxBars - 1 - offsetBars),
        );
        const audioPosition =
          (rightmostBarIndex / maxBars) * audioBufferRef.current.duration;
        const direction = e.clientX - lastMouseX;
        lastMouseX = e.clientX;
        playScrubSound(
          Math.max(
            0,
            Math.min(audioBufferRef.current.duration - 0.1, audioPosition),
          ),
          direction,
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      if (enableAudioPlayback && audioBufferRef.current) {
        const step = barWidth + barGap;
        const maxBars = historyRef.current.length;
        const offsetBars = Math.floor(dragOffset / step);
        const rightmostBarIndex = Math.max(
          0,
          Math.min(maxBars - 1, maxBars - 1 - offsetBars),
        );
        const audioPosition =
          (rightmostBarIndex / maxBars) * audioBufferRef.current.duration;
        playFromPosition(
          Math.max(
            0,
            Math.min(audioBufferRef.current.duration - 0.1, audioPosition),
          ),
        );
      }

      stopScrub();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    barWidth,
    barGap,
    setDragOffset,
    dragOffset,
    enableAudioPlayback,
    playScrubSound,
    playFromPosition,
    stopScrub,
    historyRef,
    canvasRef,
    audioBufferRef,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (active || historyRef.current.length === 0) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = dragOffset;
  };

  return { isDragging, handleMouseDown };
}
