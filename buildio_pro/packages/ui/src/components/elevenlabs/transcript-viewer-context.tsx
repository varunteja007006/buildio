"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

import {
  useTranscriptViewer,
  type CharacterAlignmentResponseModel,
  type SegmentComposer,
  type UseTranscriptViewerResult,
} from "@workspace/ui/hooks/use-transcript-viewer";
import { cn } from "@workspace/ui/lib/utils";

type TranscriptViewerContextValue = UseTranscriptViewerResult & {
  audioProps: Omit<ComponentPropsWithRef<"audio">, "children" | "src">;
};

const TranscriptViewerContext =
  createContext<TranscriptViewerContextValue | null>(null);

function useTranscriptViewerContext() {
  const context = useContext(TranscriptViewerContext);
  if (!context) {
    throw new Error(
      "useTranscriptViewerContext must be used within a TranscriptViewer",
    );
  }
  return context;
}

type TranscriptViewerProviderProps = {
  value: TranscriptViewerContextValue;
  children: ReactNode;
};

function TranscriptViewerProvider({
  value,
  children,
}: TranscriptViewerProviderProps) {
  return (
    <TranscriptViewerContext.Provider value={value}>
      {children}
    </TranscriptViewerContext.Provider>
  );
}

type AudioType =
  | "audio/mpeg"
  | "audio/wav"
  | "audio/ogg"
  | "audio/mp3"
  | "audio/m4a"
  | "audio/aac"
  | "audio/webm";

type TranscriptViewerContainerProps = {
  audioSrc: string;
  audioType?: AudioType;
  alignment: CharacterAlignmentResponseModel;
  segmentComposer?: SegmentComposer;
  hideAudioTags?: boolean;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "children"> &
  Pick<
    Parameters<typeof useTranscriptViewer>[0],
    "onPlay" | "onPause" | "onTimeUpdate" | "onEnded" | "onDurationChange"
  >;

function TranscriptViewerContainer({
  audioSrc,
  audioType = "audio/mpeg",
  alignment,
  segmentComposer,
  hideAudioTags = true,
  children,
  className,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
  ...props
}: TranscriptViewerContainerProps) {
  const viewerState = useTranscriptViewer({
    alignment,
    hideAudioTags,
    segmentComposer,
    onPlay,
    onPause,
    onTimeUpdate,
    onEnded,
    onDurationChange,
  });

  const { audioRef } = viewerState;

  const audioProps = useMemo(
    () => ({
      ref: audioRef,
      controls: false,
      preload: "metadata" as const,
      src: audioSrc,
      children: <source src={audioSrc} type={audioType} />,
    }),
    [audioRef, audioSrc, audioType],
  );

  const contextValue = useMemo(
    () => ({
      ...viewerState,
      audioProps,
    }),
    [viewerState, audioProps],
  );

  return (
    <TranscriptViewerProvider value={contextValue}>
      <div
        data-slot="transcript-viewer-root"
        className={cn("space-y-4 p-4", className)}
        {...props}
      >
        {children}
      </div>
    </TranscriptViewerProvider>
  );
}

export {
  TranscriptViewerContainer,
  TranscriptViewerProvider,
  useTranscriptViewerContext,
};
