"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type LiveMicrophonePlaybackOptions = {
  enableAudioPlayback: boolean;
  playbackRate: number;
  barWidth: number;
  barGap: number;
  containerRef: RefObject<HTMLDivElement | null>;
  historyRef: RefObject<number[]>;
  setDragOffset?: (offset: number) => void;
  audioContextRef: RefObject<AudioContext | null>;
  audioBufferRef: RefObject<AudioBuffer | null>;
  sourceNodeRef: RefObject<AudioBufferSourceNode | null>;
  scrubSourceRef: RefObject<AudioBufferSourceNode | null>;
};

export function useLiveMicrophonePlayback(
  options: LiveMicrophonePlaybackOptions,
) {
  const {
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
  } = options;

  const playbackStartTimeRef = useRef(0);
  const [playbackPosition, setPlaybackPosition] = useState<number | null>(null);

  const playScrubSound = useCallback(
    (position: number, direction: number) => {
      if (
        !enableAudioPlayback ||
        !audioBufferRef.current ||
        !audioContextRef.current
      )
        return;

      if (scrubSourceRef.current) {
        try {
          scrubSourceRef.current.stop();
        } catch {
          // Ignore stop errors from already-stopped sources
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;

      const speed = Math.abs(direction);
      const rate =
        direction > 0
          ? Math.min(3, 1 + speed * 0.1)
          : Math.max(-3, -1 - speed * 0.1);

      source.playbackRate.value = rate;

      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = Math.max(200, 2000 - speed * 100);

      source.connect(filter);
      filter.connect(audioContextRef.current.destination);

      const startTime = Math.max(
        0,
        Math.min(position, audioBufferRef.current.duration - 0.1),
      );
      source.start(0, startTime, 0.1);
      scrubSourceRef.current = source;
    },
    [enableAudioPlayback, audioBufferRef, audioContextRef, scrubSourceRef],
  );

  const playFromPosition = useCallback(
    (position: number) => {
      if (
        !enableAudioPlayback ||
        !audioBufferRef.current ||
        !audioContextRef.current
      )
        return;

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // Ignore stop errors from already-stopped sources
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = playbackRate;
      source.connect(audioContextRef.current.destination);

      const startTime = Math.max(
        0,
        Math.min(position, audioBufferRef.current.duration),
      );
      source.start(0, startTime);
      sourceNodeRef.current = source;

      playbackStartTimeRef.current =
        audioContextRef.current.currentTime - startTime;
      setPlaybackPosition(startTime);

      source.onended = () => {
        setPlaybackPosition(null);
      };
    },
    [
      enableAudioPlayback,
      playbackRate,
      audioBufferRef,
      audioContextRef,
      sourceNodeRef,
    ],
  );

  const stopScrub = useCallback(() => {
    if (scrubSourceRef.current) {
      try {
        scrubSourceRef.current.stop();
      } catch {
        // Ignore stop errors from already-stopped sources
      }
    }
  }, [scrubSourceRef]);

  useEffect(() => {
    if (playbackPosition === null || !audioBufferRef.current) return;

    let animationId: number;
    const updatePlaybackVisual = () => {
      if (
        audioContextRef.current &&
        sourceNodeRef.current &&
        audioBufferRef.current
      ) {
        const elapsed =
          audioContextRef.current.currentTime - playbackStartTimeRef.current;
        const currentPos = playbackPosition + elapsed * playbackRate;

        if (currentPos < audioBufferRef.current.duration) {
          const progressRatio = currentPos / audioBufferRef.current.duration;
          const currentBarIndex = Math.floor(
            progressRatio * historyRef.current.length,
          );
          const step = barWidth + barGap;

          const containerWidth =
            containerRef.current?.getBoundingClientRect().width || 0;
          const viewBars = Math.floor(containerWidth / step);
          const targetOffset =
            -(currentBarIndex - (historyRef.current.length - viewBars)) * step;
          const clampedOffset = Math.max(
            -(historyRef.current.length - viewBars) * step,
            Math.min(0, targetOffset),
          );

          setDragOffset?.(clampedOffset);
          animationId = requestAnimationFrame(updatePlaybackVisual);
        } else {
          setPlaybackPosition(null);
          const step = barWidth + barGap;
          const containerWidth =
            containerRef.current?.getBoundingClientRect().width || 0;
          const viewBars = Math.floor(containerWidth / step);
          setDragOffset?.(-(historyRef.current.length - viewBars) * step);
        }
      }
    };

    animationId = requestAnimationFrame(updatePlaybackVisual);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [
    playbackPosition,
    playbackRate,
    barWidth,
    barGap,
    setDragOffset,
    historyRef,
    containerRef,
    audioContextRef,
    audioBufferRef,
    sourceNodeRef,
  ]);

  return {
    playbackPosition,
    setPlaybackPosition,
    playScrubSound,
    playFromPosition,
    stopScrub,
  };
}
