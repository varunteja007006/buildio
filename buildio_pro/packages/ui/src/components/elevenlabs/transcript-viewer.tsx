"use client";

// Compatibility adjustment: `CharacterAlignmentResponseModel` is declared
// locally in `@workspace/ui/hooks/use-transcript-viewer` instead of being
// imported from `@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel`.
export type { CharacterAlignmentResponseModel } from "@workspace/ui/hooks/use-transcript-viewer";

export {
  TranscriptViewerContainer,
  TranscriptViewerProvider,
  useTranscriptViewerContext,
} from "./transcript-viewer-context.js";
export {
  TranscriptViewerWord,
  TranscriptViewerWords,
} from "./transcript-viewer-words.js";
export {
  TranscriptViewerAudio,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
} from "./transcript-viewer-controls.js";
