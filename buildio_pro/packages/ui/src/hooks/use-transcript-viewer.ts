"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { useAudioPlaybackSync } from "./use-audio-playback-sync.js";
import {
  composeSegments,
  findWordIndexAtTime,
  type SegmentComposer,
  type TranscriptSegment,
  type TranscriptWord,
} from "./use-transcript-viewer-compose.js";

/**
 * Compatibility adjustment: the upstream sources import this type from
 * `@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel`.
 * The `@elevenlabs/elevenlabs-js` SDK dependency is intentionally not added
 * to this package, so the model is declared locally instead. It mirrors the
 * SDK's camelCase projection of the ElevenLabs REST API fields
 * (`characters`, `character_start_times_seconds`,
 * `character_end_times_seconds`), which is the property shape this hook and
 * the transcript viewer components consume.
 */
type CharacterAlignmentResponseModel = {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
};

type UseTranscriptViewerProps = {
  alignment: CharacterAlignmentResponseModel;
  segmentComposer?: SegmentComposer;
  hideAudioTags?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onDurationChange?: (duration: number) => void;
};

type UseTranscriptViewerResult = {
  segments: TranscriptSegment[];
  words: TranscriptWord[];
  spokenSegments: TranscriptSegment[];
  unspokenSegments: TranscriptSegment[];
  currentWord: TranscriptWord | null;
  currentSegmentIndex: number;
  currentWordIndex: number;
  seekToTime: (time: number) => void;
  seekToWord: (word: number | TranscriptWord) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isScrubbing: boolean;
  duration: number;
  currentTime: number;
  play: () => void;
  pause: () => void;
  startScrubbing: () => void;
  endScrubbing: () => void;
};

function useTranscriptViewer({
  alignment,
  hideAudioTags = true,
  segmentComposer,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
}: UseTranscriptViewerProps): UseTranscriptViewerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleTimeUpdateRef = useRef<(time: number) => void>(() => {});

  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const { segments, words } = useMemo(() => {
    if (segmentComposer) {
      return segmentComposer(alignment);
    }
    return composeSegments(alignment, { hideAudioTags });
  }, [segmentComposer, alignment, hideAudioTags]);

  // Best-effort duration guess from alignment data while metadata loads
  const guessedDuration = useMemo(() => {
    const ends = alignment?.characterEndTimesSeconds;
    if (Array.isArray(ends) && ends.length) {
      const last = ends[ends.length - 1] ?? 0;
      return Number.isFinite(last) ? last : 0;
    }
    const lastWord = words[words.length - 1];
    if (lastWord) {
      return Number.isFinite(lastWord.endTime) ? lastWord.endTime : 0;
    }
    return 0;
  }, [alignment, words]);

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(() =>
    words.length ? 0 : -1,
  );

  useEffect(() => {
    setCurrentTime(0);
    setDuration(guessedDuration);
    setIsPlaying(false);
    setCurrentWordIndex(words.length ? 0 : -1);
  }, [words.length, alignment, guessedDuration]);

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!words.length) return;

      const currentWord =
        currentWordIndex >= 0 && currentWordIndex < words.length
          ? words[currentWordIndex]
          : undefined;

      if (!currentWord) {
        const found = findWordIndexAtTime(words, currentTime);
        if (found !== -1) setCurrentWordIndex(found);
        return;
      }

      let next = currentWordIndex;
      if (
        currentTime >= currentWord.endTime &&
        currentWordIndex + 1 < words.length
      ) {
        while (next + 1 < words.length) {
          const nextWord = words[next + 1];
          if (!nextWord || currentTime < nextWord.startTime) break;
          next++;
        }
        // Whether we are inside the next word's window or landed in a timing
        // gap (no word contains currentTime), snap to the latest word that
        // started at or before currentTime.
        setCurrentWordIndex(next);
        return;
      }

      if (currentTime < currentWord.startTime) {
        const found = findWordIndexAtTime(words, currentTime);
        if (found !== -1) setCurrentWordIndex(found);
        return;
      }

      const found = findWordIndexAtTime(words, currentTime);
      if (found !== -1 && found !== currentWordIndex) {
        setCurrentWordIndex(found);
      }
    },
    [currentWordIndex, words],
  );

  useEffect(() => {
    handleTimeUpdateRef.current = handleTimeUpdate;
  }, [handleTimeUpdate]);

  const { startRaf, stopRaf } = useAudioPlaybackSync({
    audioRef,
    timeUpdateRef: handleTimeUpdateRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    onPlay,
    onPause,
    onTimeUpdate,
    onEnded,
    onDurationChange,
  });

  const seekToTime = useCallback(
    (time: number) => {
      const node = audioRef.current;
      if (!node) return;
      // Optimistically update UI time immediately to reflect the seek,
      // since some browsers coalesce timeupdate/seeked events under rapid seeks.
      setCurrentTime(time);
      node.currentTime = time;
      handleTimeUpdateRef.current(time);
    },
    [audioRef],
  );

  const seekToWord = useCallback(
    (word: number | TranscriptWord) => {
      const target = typeof word === "number" ? words[word] : word;
      if (!target) return;
      seekToTime(target.startTime);
    },
    [seekToTime, words],
  );

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    }
  }, [audioRef]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
  }, [audioRef]);

  const startScrubbing = useCallback(() => {
    setIsScrubbing(true);
    stopRaf();
  }, [stopRaf]);

  const endScrubbing = useCallback(() => {
    setIsScrubbing(false);
    const node = audioRef.current;
    if (node && !node.paused) {
      startRaf();
    }
  }, [audioRef, startRaf]);

  const currentWord =
    currentWordIndex >= 0 && currentWordIndex < words.length
      ? (words[currentWordIndex] ?? null)
      : null;
  const currentSegmentIndex = currentWord?.segmentIndex ?? -1;

  const spokenSegments = useMemo(() => {
    if (!segments.length || currentSegmentIndex <= 0) return [];
    return segments.slice(0, currentSegmentIndex);
  }, [segments, currentSegmentIndex]);

  const unspokenSegments = useMemo(() => {
    if (!segments.length) return [];
    if (currentSegmentIndex === -1) return segments;
    if (currentSegmentIndex + 1 >= segments.length) return [];
    return segments.slice(currentSegmentIndex + 1);
  }, [segments, currentSegmentIndex]);

  return {
    segments,
    words,
    spokenSegments,
    unspokenSegments,
    currentWord,
    currentSegmentIndex,
    currentWordIndex,
    seekToTime,
    seekToWord,
    audioRef,
    isPlaying,
    isScrubbing,
    duration,
    currentTime,
    play,
    pause,
    startScrubbing,
    endScrubbing,
  };
}

export { useTranscriptViewer };
export type {
  CharacterAlignmentResponseModel,
  UseTranscriptViewerProps,
  UseTranscriptViewerResult,
};
export type {
  ComposeSegmentsOptions,
  ComposeSegmentsResult,
  SegmentComposer,
  TranscriptSegment,
  TranscriptWord,
} from "./use-transcript-viewer-compose.js";
