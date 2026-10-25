"use client";

import type { CharacterAlignmentResponseModel } from "./use-transcript-viewer.js";

type ComposeSegmentsOptions = {
  hideAudioTags?: boolean;
};

type BaseSegment = {
  segmentIndex: number;
  text: string;
};

export type TranscriptWord = BaseSegment & {
  kind: "word";
  wordIndex: number;
  startTime: number;
  endTime: number;
};

type GapSegment = BaseSegment & {
  kind: "gap";
};

export type TranscriptSegment = TranscriptWord | GapSegment;

export type ComposeSegmentsResult = {
  segments: TranscriptSegment[];
  words: TranscriptWord[];
};

export type SegmentComposer = (
  alignment: CharacterAlignmentResponseModel,
) => ComposeSegmentsResult;

export function composeSegments(
  alignment: CharacterAlignmentResponseModel,
  options: ComposeSegmentsOptions = {},
): ComposeSegmentsResult {
  const {
    characters,
    characterStartTimesSeconds: starts,
    characterEndTimesSeconds: ends,
  } = alignment;

  const segments: TranscriptSegment[] = [];
  const words: TranscriptWord[] = [];

  let wordBuffer = "";
  let whitespaceBuffer = "";
  let wordStart = 0;
  let wordEnd = 0;
  let segmentIndex = 0;
  let wordIndex = 0;
  let insideAudioTag = false;

  const hideAudioTags = options.hideAudioTags ?? false;

  const flushWhitespace = () => {
    if (!whitespaceBuffer) return;
    segments.push({
      kind: "gap",
      segmentIndex: segmentIndex++,
      text: whitespaceBuffer,
    });
    whitespaceBuffer = "";
  };

  const flushWord = () => {
    if (!wordBuffer) return;
    const word: TranscriptWord = {
      kind: "word",
      segmentIndex: segmentIndex++,
      wordIndex: wordIndex++,
      text: wordBuffer,
      startTime: wordStart,
      endTime: wordEnd,
    };
    segments.push(word);
    words.push(word);
    wordBuffer = "";
  };

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    if (char === undefined) continue;
    const start = starts[i] ?? 0;
    const end = ends[i] ?? start;

    if (hideAudioTags) {
      if (char === "[") {
        flushWord();
        whitespaceBuffer = "";
        insideAudioTag = true;
        continue;
      }

      if (insideAudioTag) {
        if (char === "]") insideAudioTag = false;
        continue;
      }
    }

    if (/\s/.test(char)) {
      flushWord();
      whitespaceBuffer += char;
      continue;
    }

    if (whitespaceBuffer) {
      flushWhitespace();
    }

    if (!wordBuffer) {
      wordBuffer = char;
      wordStart = start;
      wordEnd = end;
    } else {
      wordBuffer += char;
      wordEnd = end;
    }
  }

  flushWord();
  flushWhitespace();

  return { segments, words };
}

export function findWordIndexAtTime(
  words: TranscriptWord[],
  time: number,
): number {
  if (!words.length) return -1;
  let lo = 0;
  let hi = words.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const word = words[mid];
    if (!word) break;
    if (time >= word.startTime && time < word.endTime) {
      answer = mid;
      break;
    }
    if (time < word.startTime) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return answer;
}

export type { ComposeSegmentsOptions };
