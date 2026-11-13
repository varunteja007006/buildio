# slider

2026-11-13 · strangler-fig (slider-base.tsx → slider.tsx) · ✅ Migrated cleanly; `pnpm --filter=web|cortex-ai|expense-tracker typecheck` all passed with no errors in any slider-touched file. Remaining typecheck failures are in `packages/ui/src/components/action-bar-item.tsx` and stem from the concurrently running **button** migration (BaseUIEvent), not this work.

## Changed

- `packages/ui/src/components/slider.tsx` — migrated from `radix-ui` to `@base-ui/react/slider` (Base UI 1.9.0). Anatomy mapped per the d.ts: Root → Root, Track → Control+Track, Range → Indicator, Thumb → Thumb. All Tailwind class strings kept byte-identical to the Radix version; the only new class string is on the **new** `Slider.Control` part (`relative flex w-full touch-none items-center select-none data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col`), composed of existing tokens from the root string — required because Base UI inserts a Control div and thumbs are absolutely positioned inside it (verified in `SliderThumb.js`: `position: absolute; insetInlineStart: <pct>%; top: 50%` relative to the control).
- Wrapper is now generic (`Slider<Value extends number | readonly number[]>`) so consumers keep narrow `onValueChange` value types. Base UI types it as `(value: Value extends number ? number : Value, eventDetails: SliderRoot.ChangeEventDetails) => void`; without the generic, both consumer callbacks (which take `[number, number]` / `number[]`) would fail under strict function types.
- Thumbs now receive an explicit `index={index}` prop (required for multi-thumb range sliders / SSR per `SliderThumb.Props`).
- `data-slot="slider-control"` added for the new part; existing `data-slot` values (`slider`, `slider-track`, `slider-range`, `slider-thumb`) kept unchanged so external hooks/tests are unaffected.
- Consumers repointed (then flipped back to `components/slider` after the finalize step): `apps/web/components/showcase/forms-section.tsx`, `packages/ui/src/components/data-table/data-table-slider-filter.tsx`.
- No consumer call-site props needed changing: Base UI reuses the same prop names (`value`, `defaultValue`, `onValueChange`, `min`, `max`, `step`, `orientation`, `disabled`).

## Left alone

- The `import { Popover } from "@workspace/ui/components/popover-base"` in `data-table-slider-filter.tsx` — that is the sibling popover migration's repoint, not touched here.
- `apps/web` is the only app importing the Slider wrapper directly; `expense-tracker`/`cortex-ai` consume it transitively via `data-table` and were typechecked for that reason.
- `packages/ui/src/components/elevenlabs/audio-player-progress.tsx` uses `data-slot="slider-thumb"` on its own markup (a progress bar, not this component) — untouched.
- animate-ui/*, package.json, pnpm-lock.yaml, globals.css, components.json — untouched per rules.
- `grep -rn "radix-ui\|@radix-ui"` on the wrapper and both consumers: clean.

## Behavior changes

- Verified against the d.ts: Base UI emits `data-orientation` and `data-disabled` exactly like Radix (checked `SliderRootDataAttributes.d.ts`/`SliderControlDataAttributes.d.ts`), so all `data-[orientation=…]` / `data-[disabled]` Tailwind variants still fire. Base UI additionally emits `data-dragging`, `data-valid`, `data-invalid`, `data-focused`, etc. — no classes relied on these, no visual diff.
- `onValueChange` now fires with an extra `eventDetails` second argument (reasons: `input-change`, `track-press`, `drag`, `keyboard`, `none`) — compatible with all existing consumer signatures.
- Radix's `onValueChangeComplete` maps to Base UI's `onValueCommitted`; no consumer used it, so nothing to rename.
- Visual: the range Indicator no longer relies on the class `absolute` alone — Base UI sets inline styles (`position: relative` horizontal with computed width, `position: absolute` vertical), which override the legacy `absolute` class. Result is the same rendered geometry; the class string was kept byte-identical anyway.
- Thumb positioning moves from Radix's internal computation to Base UI's (`insetInlineStart: <pct>%` + `translate`), still centered on the track — pixel-equivalent for this styling.
- Note for the sibling popover agent: `data-table-slider-filter.tsx`'s slider import is back on `@workspace/ui/components/slider`; only its popover import is `popover-base`.

## Verify by hand

1. `apps/web` showcase (Forms section): drag the single-value demo slider — value label should track `slider[0]` smoothly during drag.
2. Range slider (`defaultValue={[30, 70]}`): both thumbs draggable, push each other, order preserved; keyboard focus ring (`ring-ring/50`) visible on focused thumb.
3. `expense-tracker` / `cortex-ai` data-table slider filter: drag range thumb — filter values update ([min, max] shape preserved by the generic wrapper); Clear button still resets.
4. Vertical slider (none currently used by consumers, but supported): `data-[orientation=vertical]` variants verified against Base UI's emitted attributes — check `min-h-44` layout renders as before if any app adopts it.
5. Confirm disabled state dims the track (`data-[disabled]:opacity-50`) if a consumer passes `disabled`.
6. Final sweep: `grep -rn "radix-ui\|@radix-ui" packages/ui/src/components/slider.tsx packages/ui/src/components/data-table/data-table-slider-filter.tsx apps/web/components/showcase/forms-section.tsx` → no matches.
