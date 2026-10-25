"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

type UseAudioPlaybackSyncOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  timeUpdateRef: RefObject<(time: number) => void>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setDuration: Dispatch<SetStateAction<number>>;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onDurationChange?: (duration: number) => void;
};

type UseAudioPlaybackSyncResult = {
  startRaf: () => void;
  stopRaf: () => void;
};

/**
 * Bridges an `<audio>` element with transcript playback state: media event
 * listeners, a rAF loop for smooth time tracking, and opportunistic duration
 * pickup when metadata arrives.
 */
function useAudioPlaybackSync({
  audioRef,
  timeUpdateRef,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
}: UseAudioPlaybackSyncOptions): UseAudioPlaybackSyncResult {
  const rafRef = useRef<number | null>(null);
  const onDurationChangeRef = useRef<(duration: number) => void>(() => {});

  useEffect(() => {
    onDurationChangeRef.current = onDurationChange ?? (() => {});
  }, [onDurationChange]);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startRaf = useCallback(() => {
    if (rafRef.current != null) return;
    const tick = () => {
      const node = audioRef.current;
      if (!node) {
        rafRef.current = null;
        return;
      }
      const time = node.currentTime;
      setCurrentTime(time);
      timeUpdateRef.current(time);
      // Opportunistically pick up duration when metadata arrives, even if
      // duration events were missed or coalesced by the browser.
      if (Number.isFinite(node.duration) && node.duration > 0) {
        setDuration((prev) => {
          if (!prev) {
            onDurationChangeRef.current(node.duration);
            return node.duration;
          }
          return prev;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [audioRef, setCurrentTime, setDuration, timeUpdateRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncPlayback = () => setIsPlaying(!audio.paused);
    const syncTime = () => setCurrentTime(audio.currentTime);
    const syncDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);

    const handlePlay = () => {
      syncPlayback();
      startRaf();
      onPlay?.();
    };
    const handlePause = () => {
      syncPlayback();
      syncTime();
      stopRaf();
      onPause?.();
    };
    const handleEnded = () => {
      syncPlayback();
      syncTime();
      stopRaf();
      onEnded?.();
    };
    const handleTimeUpdate = () => {
      syncTime();
      onTimeUpdate?.(audio.currentTime);
    };
    const handleSeeked = () => {
      syncTime();
      timeUpdateRef.current(audio.currentTime);
    };
    const handleDuration = () => {
      syncDuration();
      onDurationChange?.(audio.duration);
    };

    syncPlayback();
    syncTime();
    syncDuration();
    if (!audio.paused) {
      startRaf();
    } else {
      stopRaf();
    }

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("durationchange", handleDuration);
    audio.addEventListener("loadedmetadata", handleDuration);

    return () => {
      stopRaf();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("durationchange", handleDuration);
      audio.removeEventListener("loadedmetadata", handleDuration);
    };
  }, [
    audioRef,
    startRaf,
    stopRaf,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
  ]);

  return { startRaf, stopRaf };
}

export { useAudioPlaybackSync };
