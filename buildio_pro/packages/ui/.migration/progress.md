# progress

2026-11-12 · Strategy: transformation engine (project is legacy style `new-york`, which has no `base-` counterpart, so the golden pair was used only for API verification; the wrapper's exact classes were kept) · Verdict: migrated cleanly to `@base-ui/react/progress` — `Track` added between Root and Indicator, the Radix `translateX` style deleted (Base UI sizes the Indicator itself), zero progress-related typecheck errors across packages/ui, cortex-ai, expense-tracker, and web. Note: nine parallel sibling migrations were in flight; remaining errors in app typechecks belong to another component (`toggle-group-base` not yet present), not progress.

## Changed

- `packages/ui/src/components/progress.tsx` — rewired from the consolidated `radix-ui` package to `@base-ui/react/progress`. Anatomy change: Base UI's `Indicator` MUST be nested in the new `Progress.Track`, so `<Track data-slot="progress-track" className="h-full w-full">` was added between Root and Indicator. Deleted `style={{ transform: translateX(-(100 - value)%) }}` from the Indicator: verified in `node_modules/@base-ui/react/progress/indicator/ProgressIndicator.js` that the primitive sets `width: '<pct>%'` itself. Root/Indicator classNames kept verbatim; no data-attribute or CSS-var selectors existed in this wrapper, so class-mapping renames were no-ops. `value` handling: Base UI's `Root` requires `value: number | null` (verified in `ProgressRoot.d.ts`; `null` = indeterminate) whereas Radix's was optional, so the wrapper's props type is `Omit<..., "value"> & { value?: number | null }` with `value={value ?? null}` — an omitted value stays indeterminate exactly like Radix. Export names, "use client", and `data-slot` names unchanged.
- `packages/ui/src/components/elevenlabs/scrub-bar.tsx:13` — import repointed to the `-base` file during the strangler-fig phase, flipped back to `@workspace/ui/components/progress` at finalize. Also line 166: `ScrubBarProgress`'s `[&>div]:transition-none` selector broke under the new anatomy (the direct child of Root is now Track, not Indicator, so the transition-kill would have silently stopped applying during scrubbing); changed to `[&_[data-slot=progress-indicator]]:transition-none`, which keeps working across both anatomies.
- `apps/web/components/showcase/feedback-section.tsx:19` — import repointed (call sites pass literal `value={32|70|100}`; compatible).
- `apps/cortex-ai/components/file-upload-parts.tsx:4` — import repointed (`value={progress}`; compatible).
- `apps/expense-tracker/components/organisms/event/event-details.tsx:14`, `event/event-card.tsx:10`, `insights/card-intelligence-card.tsx:10`, `insights/emi-summary-card.tsx:10` — imports repointed (call sites pass clamped numbers; compatible, including their `aria-label`/`className` props which pass through Root).
- Leftover sweep clean: `grep -n "radix-ui\|@radix-ui"` on all of the above files returns nothing.

## Left alone

- `packages/ui/src/components/progress-08.tsx` (`CircularProgress`) — a separate registry component consumed via `@workspace/ui/components/progress-08`; not part of this migration.
- `apps/expense-tracker/app/(protected)/dashboard/page.tsx:31` — the only progress import there is a commented-out line; untouched.
- `packages/ui/package.json` / `components.json` / lockfile — per instructions: `@base-ui/react@1.9.0` was already installed via the catalog; style stays `new-york` (progressive mode, no flip until the last component).
- `packages/ui/node_modules/@base-ui/react/progress/` — read-only API verification (Root/Track/Indicator/Value/Label; only Root/Track/Indicator used).
- Other components' wrappers and the sibling agents' files — untouched; concurrent migrations in flight (toggle-group, checkbox, switch, toggle, tooltip, avatar, separator, collapsible, radio-group).

## Behavior changes

- DOM anatomy: Root > Track > Indicator instead of Root > Indicator. Any consumer styling via direct-child selectors (`> div`) or expecting Indicator as Root's immediate child is affected; the only such consumer found (`scrub-bar.tsx`) was fixed. Styling via `[data-slot]` is unaffected.
- `data-state="indeterminate"` / `="progressing"` / `="complete"` are replaced by boolean-presence attributes (`data-indeterminate`, `data-progressing`, `data-complete`), and `data-value`/`data-max` are dropped. No current wrapper or consumer styles used these, so no visual change, but future CSS must target the new attribute names.
- Accessible value announcement: Radix `getValueLabel` (raw `value, max`) is renamed `getAriaValueText` in Base UI with a different signature (`formattedValue, value`); unused here. Consumers setting `aria-label` on Root still work.
- None of these deltas affect the current call sites; all flagged rather than patched (except the scrub-bar selector fix, which preserves the original intent).

## Verify by hand

- `apps/web` showcase → Progress examples: bars at 32% / 70% / 100% fill to the correct width; 100% is fully filled (regression check for the deleted translateX style).
- `apps/cortex-ai` file upload: upload a file, watch the bar animate from 0 → 100% and land flush with the track end.
- `apps/expense-tracker` dashboard/event cards: event progress bars and credit-utilization/EMI bars render at the expected fractions (including values near 0 and 100); `bg-primary/20` track still visible behind the fill.
- Indeterminate: render `<Progress />` (no `value`) — the track should show the indeterminate state rather than erroring or rendering a full bar.
- Audio player (scrub-bar): drag the scrubber — the fill must follow the pointer instantly with NO transition lag (the `[&_[data-slot=progress-indicator]]:transition-none` fix).
