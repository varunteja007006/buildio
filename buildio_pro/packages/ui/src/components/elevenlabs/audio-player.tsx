"use client";

export {
  useAudioPlayer,
  useAudioPlayerTime,
  type AudioPlayerApi,
  type AudioPlayerItem,
} from "./audio-player-context.js";
export { AudioPlayerProvider } from "./audio-player-provider.js";
export {
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerTime,
} from "./audio-player-progress.js";
export {
  AudioPlayerButton,
  type AudioPlayerButtonProps,
} from "./audio-player-controls.js";
export {
  AudioPlayerSpeed,
  AudioPlayerSpeedButtonGroup,
  type AudioPlayerSpeedButtonGroupProps,
  type AudioPlayerSpeedProps,
} from "./audio-player-speed.js";
export { exampleTracks } from "./audio-player-tracks.js";
