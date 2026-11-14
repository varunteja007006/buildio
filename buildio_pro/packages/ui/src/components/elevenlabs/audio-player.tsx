"use client";

export {
  useAudioPlayer,
  useAudioPlayerTime,
  type AudioPlayerApi,
  type AudioPlayerItem,
} from "@workspace/ui/components/elevenlabs/audio-player-context";
export { AudioPlayerProvider } from "@workspace/ui/components/elevenlabs/audio-player-provider";
export {
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerTime,
} from "@workspace/ui/components/elevenlabs/audio-player-progress";
export {
  AudioPlayerButton,
  type AudioPlayerButtonProps,
} from "@workspace/ui/components/elevenlabs/audio-player-controls";
export {
  AudioPlayerSpeed,
  AudioPlayerSpeedButtonGroup,
  type AudioPlayerSpeedButtonGroupProps,
  type AudioPlayerSpeedProps,
} from "@workspace/ui/components/elevenlabs/audio-player-speed";
export { exampleTracks } from "@workspace/ui/components/elevenlabs/audio-player-tracks";
