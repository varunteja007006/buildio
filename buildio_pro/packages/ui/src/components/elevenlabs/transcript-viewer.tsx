"use client";

// Compatibility adjustment: `CharacterAlignmentResponseModel` is declared
// locally in `@workspace/ui/hooks/use-transcript-viewer` instead of being
// imported from `@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel`.
export type { CharacterAlignmentResponseModel } from "@workspace/ui/hooks/use-transcript-viewer";

export {
  TranscriptViewerContainer,
  TranscriptViewerProvider,
  useTranscriptViewerContext,
} from "@workspace/ui/components/elevenlabs/transcript-viewer-context";
export {
  TranscriptViewerWord,
  TranscriptViewerWords,
} from "@workspace/ui/components/elevenlabs/transcript-viewer-words";
export {
  TranscriptViewerAudio,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
} from "@workspace/ui/components/elevenlabs/transcript-viewer-controls";
