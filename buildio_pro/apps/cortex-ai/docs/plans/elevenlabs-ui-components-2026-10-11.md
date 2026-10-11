# ElevenLabs UI Components Plan — cortex-ai

**Date:** 2026-10-11
**Status:** Planned
**Scope:** Add missing ElevenLabs UI components to the shared `packages/ui` package for use by `cortex-ai`; avoid duplicating existing shared components.

## Goal

Adopt the requested ElevenLabs UI components in the shared UI package and make them available to Cortex AI through `@workspace/ui/components/elevenlabs/*` imports. Prefer the official registry sources and their documented behavior over locally approximated copies.

## Current baseline

- Registry retrieval for `waveform.json` returned HTTP 429 through both the ElevenLabs CLI and shadcn CLI. No registry components were installed by those attempts.
- `packages/ui/src/components/elevenlabs/` already contains a `VoicePicker`, a `BarVisualizer`, and its helpers. Preserve these files; review the picker against the official source when registry access returns.
- Existing shared equivalents: `ShimmeringText` in `animate-ui/primitives/texts/shimmering.tsx`; message components in `message.tsx` and `ai-elements/message.tsx`; `MessageResponse` in `ai-elements/message.tsx`; and `Conversation` in `ai-elements/conversation.tsx`.
- `BarVisualizer` is not the documented canvas waveform/live waveform component. `animate-ui/icons/orbit.tsx` is an icon, not the documented 3D Orb.

## Reuse / skip

- [ ] Keep the current Message, MessageResponse, Conversation, and ShimmeringText implementations; only add an alias or wrapper if Cortex AI needs the ElevenLabs import/API shape.
- [ ] Keep the existing VoicePicker; compare its controlled state, audio preview, and orb behavior with the official component before calling it complete.
- [ ] Do not add duplicate audio, messaging, or conversation abstractions where the existing shared components already satisfy the use case.

## Components to add

- [ ] **Waveform family:** `Waveform`, `ScrollingWaveform`, `AudioScrubber`, `MicrophoneWaveform`, `StaticWaveform`, `LiveMicrophoneWaveform`, and `RecordingWaveform`.
- [ ] **Voice Button:** recording/processing/feedback states and waveform integration.
- [ ] **Transcript Viewer:** synchronized word highlighting, audio controls, and alignment types.
- [ ] **Scrub Bar:** composable timeline track, progress, thumb, and time labels.
- [ ] **Orb:** audio/state-reactive 3D orb; verify WebGL fallback and browser compatibility.
- [ ] **Mic Selector:** device enumeration, permission/error states, preview, and stream cleanup.
- [ ] **Matrix:** accessible static and animated dot-matrix display with presets.
- [ ] **Live Waveform:** real-time canvas microphone visualization and proper audio cleanup.
- [ ] **Conversation Bar:** agent conversation controls and waveform; keep token creation server-side and never expose API keys in client code.
- [ ] **Audio Player:** shared playback provider, controls, progress, and time display.

## Implementation checklist

- [ ] Retry the official ElevenLabs registry after its rate limit clears; install components individually into `packages/ui/src/components/elevenlabs/` and review every generated file/dependency before accepting it.
- [ ] Reuse the shared Button, Popover, Slider, and styling helpers where compatible; keep ElevenLabs-specific imports within the ElevenLabs component directory.
- [ ] Add only required dependencies, using the workspace catalogs for catalog-managed versions. Document any required `@elevenlabs/*`, Three.js, or audio dependencies.
- [ ] Check microphone permission denial, device changes, audio-context/media-stream cleanup, and playback teardown for audio components.
- [ ] Confirm no file exceeds the repository's 250-line ESLint limit; split component internals when needed.
- [ ] Typecheck/lint the shared UI package and typecheck/build Cortex AI with the resulting imports. Add a small demo only if it helps verify component behavior without introducing a new showcase framework.

## Acceptance criteria

- Every missing component listed above is available from the shared UI package, with the documented public exports and props or a clearly documented compatibility adjustment.
- Existing equivalent components are reused rather than copied under another name.
- Browser-only APIs are initialized after mount or user action and cleaned up on unmount; API credentials remain server-side.
- Cortex AI can import the needed components through workspace package exports without relative paths.
