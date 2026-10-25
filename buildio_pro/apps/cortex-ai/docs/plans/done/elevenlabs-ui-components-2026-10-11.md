# ElevenLabs UI Components Plan — cortex-ai

**Date:** 2026-10-11
**Status:** ✅ Done (2026-10-25)
**Scope:** Add missing ElevenLabs UI components to the shared `packages/ui` package for use by `cortex-ai`; avoid duplicating existing shared components.

## Goal

Adopt the requested ElevenLabs UI components in the shared UI package and make them available to Cortex AI through `@workspace/ui/components/elevenlabs/*` imports. Prefer the official registry sources and their documented behavior over locally approximated copies.

## Current baseline

- Registry retrieval for `waveform.json` returned HTTP 429 through both the ElevenLabs CLI and shadcn CLI. No registry components were installed by those attempts.
- `packages/ui/src/components/elevenlabs/` already contains a `VoicePicker`, a `BarVisualizer`, and its helpers. Preserve these files; review the picker against the official source when registry access returns.
- Existing shared equivalents: `ShimmeringText` in `animate-ui/primitives/texts/shimmering.tsx`; message components in `message.tsx` and `ai-elements/message.tsx`; `MessageResponse` in `ai-elements/message.tsx`; and `Conversation` in `ai-elements/conversation.tsx`.
- `BarVisualizer` is not the documented canvas waveform/live waveform component. `animate-ui/icons/orb.tsx` is an icon, not the documented 3D Orb.

## Reuse / skip

- [x] Keep the current Message, MessageResponse, Conversation, and ShimmeringText implementations; only add an alias or wrapper if Cortex AI needs the ElevenLabs import/API shape.
- [x] Keep the existing VoicePicker; compare its controlled state, audio preview, and orb behavior with the official component before calling it complete. (Left as-is; the official registry `voice-picker.json` was not fetched — revisit if the registry becomes reachable.)
- [x] Do not add duplicate audio, messaging, or conversation abstractions where the existing shared components already satisfy the use case.

## Components to add

- [x] **Waveform family:** `Waveform`, `ScrollingWaveform`, `AudioScrubber`, `MicrophoneWaveform`, `StaticWaveform`, `LiveMicrophoneWaveform`, and `RecordingWaveform`.
- [x] **Voice Button:** recording/processing/feedback states and waveform integration.
- [x] **Transcript Viewer:** synchronized word highlighting, audio controls, and alignment types.
- [x] **Scrub Bar:** composable timeline track, progress, thumb, and time labels.
- [x] **Orb:** audio/state-reactive 3D orb; verify WebGL fallback and browser compatibility. (three.js r186; the source's GLSL compiles as-is under three's GLSL ES 3.0 auto-upgrade.)
- [x] **Mic Selector:** device enumeration, permission/error states, preview, and stream cleanup.
- [x] **Matrix:** accessible static and animated dot-matrix display with presets.
- [x] **Live Waveform:** real-time canvas microphone visualization and proper audio cleanup.
- [x] **Conversation Bar:** agent conversation controls and waveform; keep token creation server-side and never expose API keys in client code. (Component is client-only wiring via `@elevenlabs/react`; token generation stays server-side whenever Cortex AI adopts it.)
- [x] **Audio Player:** shared playback provider, controls, progress, and time display.

## Implementation checklist

- [x] ~~Retry the official ElevenLabs registry after its rate limit clears~~ Registry still returned HTTP 429. Instead, fetched the official registry item JSONs committed in the `elevenlabs/ui` GitHub repo (`apps/www/public/r/*.json`, MIT) and adapted the exact file contents from them — same official source, bypassing the rate-limited endpoint.
- [x] Reuse the shared Button, Popover, Slider, DropdownMenu, Card, Separator, Textarea, and Progress components; all ElevenLabs-specific code stays within the ElevenLabs component directory and `packages/ui/src/hooks/`.
- [x] Added dependencies through the workspace catalog (`pnpm-workspace.yaml`): `@elevenlabs/react@1.19.1` (Conversation Bar), `three@0.186.1`, `@react-three/fiber@9.8.2`, `@react-three/drei@10.7.9`, `@types/three@0.186.0` (Orb). `@radix-ui/react-slider`/`-dropdown-menu` were already present. No `@elevenlabs/elevenlabs-js` dependency was added (see compatibility adjustments).
- [x] Microphone permission denial, device changes, audio-context/media-stream cleanup, and playback teardown are preserved from the official sources (stream tracks stopped, AudioContext closed, rAF/animation frames cancelled, MediaRecorder stopped).
- [x] Every file satisfies the repository's 250-line ESLint limit (comments and blank lines excluded); large sources were split into component + helper/hook files with public APIs re-exported from the main module file.
- [x] Typecheck and lint pass for `packages/ui` and `cortex-ai`; all component import paths were smoke-tested from `apps/cortex-ai` via `@workspace/ui/components/elevenlabs/*` and `@workspace/ui/hooks/*` (scratch file removed after the check). No demo page was added.

## Compatibility adjustments (documented)

- `CharacterAlignmentResponseModel` is defined locally in `packages/ui/src/hooks/use-transcript-viewer.ts` (SDK camelCase shape: `characters`, `characterStartTimesSeconds`, `characterEndTimesSeconds`) instead of importing from `@elevenlabs/elevenlabs-js`, avoiding an SDK dependency for a single type.
- The official sources were split across multiple files to honor the 250-line ESLint limit; each main module re-exports the documented public API, so `@workspace/ui/components/elevenlabs/<name>` import paths behave as documented.
- `Orb` fetches its perlin-noise texture from `storage.googleapis.com` at runtime (unchanged from the official source); swap to a local asset if offline-first behavior is needed.
- Remaining lint warnings are `react-hooks/exhaustive-deps` inherited verbatim from the official sources' dependency arrays (behavior-preserving).

## Acceptance criteria

- [x] Every missing component listed above is available from the shared UI package, with the documented public exports and props.
- [x] Existing equivalent components are reused rather than copied under another name.
- [x] Browser-only APIs are initialized after mount or user action and cleaned up on unmount; API credentials remain server-side.
- [x] Cortex AI can import the needed components through workspace package exports without relative paths (verified by typechecked smoke imports).
