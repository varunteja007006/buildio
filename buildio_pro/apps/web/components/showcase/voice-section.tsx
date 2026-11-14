"use client";

/**
 * Voice section — the ElevenLabs UI component family.
 *
 * Only components that render without a live session, microphone or API key
 * are demoed (static data, built-in fake/local animation, or user-initiated
 * playback of ElevenLabs' public demo mp3s through a plain <audio> element).
 *
 * Skipped demos:
 * - mic-selector: opening its dropdown calls getUserMedia for device
 *   permission (use-audio-devices.ts), so it is left out.
 * - conversation-bar: needs a live ElevenLabs conversation session/API key.
 * - waveform-microphone, waveform-recording, waveform-live-microphone and the
 *   active state of live-waveform: require a getUserMedia mic stream.
 * - voice-button "recording" state: would start mic capture; idle/processing/
 *   success/error states are demoed instead (all mic-free).
 * - transcript-viewer barrel: its transcript-viewer-controls re-export has a
 *   pre-existing TS error (TS2345 with Base UI's onClick type); the demo is
 *   composed from transcript-viewer-context / -words + scrub-bar instead.
 */

import { Example, Section } from "@/components/showcase/section";
import {
  AudioPlayerDemo,
  ScrubBarDemo,
  TranscriptViewerDemo,
  VoiceButtonDemo,
  VoicePickerDemo,
} from "@/components/showcase/voice-audio-demo";
import {
  BarVisualizerDemo,
  LiveWaveformDemo,
  MatrixDemo,
  OrbDemo,
  WaveformDemo,
} from "@/components/showcase/voice-visual-demo";

export function VoiceSection() {
  return (
    <Section
      title="Voice"
      description="ElevenLabs UI audio components. Every demo is static or uses built-in fake/local animation — no microphone permission, live session or API key required."
    >
      <Example
        title="Orb"
        description="WebGL orb with idle, listening and talking agent states driven by its built-in animation."
        contentClassName="flex-col items-stretch"
      >
        <OrbDemo />
      </Example>

      <Example
        title="BarVisualizer"
        description="Bar visualizer in demo mode with fake volume bands for listening, thinking and speaking states."
        contentClassName="flex-col items-stretch"
      >
        <BarVisualizerDemo />
      </Example>

      <Example
        title="Matrix"
        description="Pixel-matrix display: pulse, loader and wave frame animations plus a static chevron pattern and a VU meter."
        contentClassName="flex-col items-stretch"
      >
        <MatrixDemo />
      </Example>

      <Example
        title="Waveform"
        description="Static seeded waveform, animated scrolling waveform and a plain waveform with explicit data."
        contentClassName="flex-col items-stretch"
      >
        <WaveformDemo />
      </Example>

      <Example
        title="LiveWaveform"
        description="Idle (dotted baseline) and processing states. The active state needs a mic stream and is intentionally not demoed."
        contentClassName="flex-col items-stretch"
      >
        <LiveWaveformDemo />
      </Example>

      <Example
        title="VoiceButton"
        description="Stateful voice button: idle with keyboard hint, processing, success and error feedback."
        contentClassName="flex-col items-stretch"
      >
        <VoiceButtonDemo />
      </Example>

      <Example
        title="VoicePicker"
        description="Combobox voice selector with static demo voices; preview playback stays disabled without preview URLs."
        contentClassName="flex-col items-stretch"
      >
        <VoicePickerDemo />
      </Example>

      <Example
        title="AudioPlayer"
        description="Provider-driven player with play/pause, seek, time labels and speed controls over ElevenLabs' public demo tracks."
        contentClassName="flex-col items-stretch"
      >
        <AudioPlayerDemo />
      </Example>

      <Example
        title="ScrubBar"
        description="Composable scrub bar (track, progress, thumb, time labels) with local state."
        contentClassName="flex-col items-stretch"
      >
        <ScrubBarDemo />
      </Example>

      <Example
        title="TranscriptViewer"
        description="Word-level transcript highlighting driven by local character-alignment data; audio is user-initiated. Composed from the context and words modules — the transcript-viewer barrel is skipped due to a pre-existing TS error in transcript-viewer-controls."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <TranscriptViewerDemo />
      </Example>
    </Section>
  );
}
