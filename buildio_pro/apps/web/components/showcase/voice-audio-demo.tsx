"use client";

/**
 * Interactive demos for the ElevenLabs audio component family.
 *
 * - AudioPlayer + TranscriptViewer use ElevenLabs' public demo mp3s through a
 *   local <audio> element (no ElevenLabs API, no signed URLs); playback is
 *   strictly user-initiated.
 * - ScrubBar and VoicePicker are pure local state.
 * - VoiceButton is never set to "recording" — that state wires LiveWaveform
 *   to getUserMedia; all other states animate without a microphone.
 */

import { Button } from "@workspace/ui/components/button";
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerSpeed,
  AudioPlayerTime,
  useAudioPlayer,
  type AudioPlayerItem,
} from "@workspace/ui/components/elevenlabs/audio-player";
import { AudioPlayerProvider } from "@workspace/ui/components/elevenlabs/audio-player-provider";
import { exampleTracks } from "@workspace/ui/components/elevenlabs/audio-player-tracks";
import {
  ScrubBarContainer,
  ScrubBarProgress,
  ScrubBarThumb,
  ScrubBarTimeLabel,
  ScrubBarTrack,
} from "@workspace/ui/components/elevenlabs/scrub-bar";
// Composed from transcript-viewer-context/-words instead of the
// transcript-viewer barrel: the barrel re-exports transcript-viewer-controls,
// which has a pre-existing TS error (TS2345, Base UI onClick type).
import {
  TranscriptViewerContainer,
  useTranscriptViewerContext,
} from "@workspace/ui/components/elevenlabs/transcript-viewer-context";
import { TranscriptViewerWords } from "@workspace/ui/components/elevenlabs/transcript-viewer-words";
import { VoiceButton } from "@workspace/ui/components/elevenlabs/voice-button";
import { VoicePicker } from "@workspace/ui/components/elevenlabs/voice-picker";
import type { CharacterAlignmentResponseModel } from "@workspace/ui/hooks/use-transcript-viewer";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useState } from "react";

const demoTracks: AudioPlayerItem<{ name: string }>[] = exampleTracks.map(
  (track) => ({ id: track.id, src: track.url, data: { name: track.name } }),
);

function PlayerControls() {
  const player = useAudioPlayer<{ name: string }>();
  const name = player.activeItem?.data?.name ?? "Track 00";

  return (
    <div className="bg-background flex w-full max-w-md items-center gap-3 rounded-md border p-3">
      <AudioPlayerButton
        item={demoTracks[0]}
        size="icon"
        variant="outline"
        aria-label="Play demo"
      />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <div className="mt-1 flex items-center gap-2">
          <AudioPlayerTime />
          <AudioPlayerProgress className="flex-1" />
          <AudioPlayerDuration />
        </div>
      </div>
      <AudioPlayerSpeed size="icon-sm" />
    </div>
  );
}

export function AudioPlayerDemo() {
  return (
    <AudioPlayerProvider<{ name: string }>>
      <PlayerControls />
    </AudioPlayerProvider>
  );
}

const scrubDuration = 214;

export function ScrubBarDemo() {
  const [value, setValue] = useState(42);

  return (
    <div className="bg-background w-full max-w-md rounded-md border p-4">
      <ScrubBarContainer
        duration={scrubDuration}
        value={value}
        onScrub={setValue}
      >
        <div className="flex w-full flex-col gap-1">
          <ScrubBarTrack>
            <ScrubBarProgress />
            <ScrubBarThumb />
          </ScrubBarTrack>
          <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
            <ScrubBarTimeLabel time={value} />
            <ScrubBarTimeLabel time={scrubDuration - value} />
          </div>
        </div>
      </ScrubBarContainer>
    </div>
  );
}

const TRANSCRIPT =
  "Hello! This transcript highlights each word as the audio plays.";
const CHAR_SECONDS = 0.055;

function buildAlignment(
  text: string,
  secondsPerChar: number,
): CharacterAlignmentResponseModel {
  const characters = [...text];
  return {
    characters,
    characterStartTimesSeconds: characters.map((_, index) =>
      Number((index * secondsPerChar).toFixed(4)),
    ),
    characterEndTimesSeconds: characters.map((_, index) =>
      Number(((index + 1) * secondsPerChar).toFixed(4)),
    ),
  };
}

function TranscriptAudio() {
  const { audioProps } = useTranscriptViewerContext();
  return <audio className="hidden" {...audioProps} />;
}

function TranscriptControls() {
  const transcript = useTranscriptViewerContext();
  const Icon = transcript.isPlaying ? PauseIcon : PlayIcon;

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={
          transcript.isPlaying ? "Pause transcript" : "Play transcript"
        }
        onClick={() =>
          transcript.isPlaying ? transcript.pause() : transcript.play()
        }
      >
        <Icon className="size-4" />
      </Button>
      <ScrubBarContainer
        duration={transcript.duration}
        value={transcript.currentTime}
        onScrub={transcript.seekToTime}
        onScrubStart={transcript.startScrubbing}
        onScrubEnd={transcript.endScrubbing}
        className="flex-1"
      >
        <div className="flex flex-1 flex-col gap-1">
          <ScrubBarTrack>
            <ScrubBarProgress />
            <ScrubBarThumb />
          </ScrubBarTrack>
          <div className="text-muted-foreground flex items-center justify-between text-xs tabular-nums">
            <ScrubBarTimeLabel time={transcript.currentTime} />
            <ScrubBarTimeLabel
              time={Math.max(0, transcript.duration - transcript.currentTime)}
            />
          </div>
        </div>
      </ScrubBarContainer>
    </div>
  );
}

export function TranscriptViewerDemo() {
  const alignment = buildAlignment(TRANSCRIPT, CHAR_SECONDS);
  const audioSrc = exampleTracks[0]?.url ?? "";

  return (
    <TranscriptViewerContainer audioSrc={audioSrc} alignment={alignment}>
      <TranscriptAudio />
      <TranscriptControls />
      <TranscriptViewerWords className="text-base leading-relaxed" />
    </TranscriptViewerContainer>
  );
}

const demoVoices = [
  { voice_id: "voice-rachel", name: "Rachel", preview_url: null },
  { voice_id: "voice-dominik", name: "Dominik", preview_url: null },
  { voice_id: "voice-bella", name: "Bella", preview_url: null },
  { voice_id: "voice-adam", name: "Adam", preview_url: null },
];

export function VoicePickerDemo() {
  const [value, setValue] = useState("voice-rachel");

  return (
    <div className="w-full max-w-xs">
      <VoicePicker
        voices={demoVoices}
        value={value}
        onValueChange={setValue}
        placeholder="Select a voice"
      />
    </div>
  );
}

export function VoiceButtonDemo() {
  return (
    <div className="flex flex-col items-stretch gap-3">
      <VoiceButton state="idle" label="Talk to assistant" trailing="⌥Space" />
      <VoiceButton state="processing" label="Transcribing…" />
      <VoiceButton state="success" label="Saved" />
      <VoiceButton state="error" label="Try again" />
    </div>
  );
}
