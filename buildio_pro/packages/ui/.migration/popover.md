# popover

2026-11-13 · Radix UI → Base UI (`@base-ui/react/popover`), Portal → Positioner → Popup anatomy with positioning props (`side`, `align`, `sideOffset`, `alignOffset`, `anchor`, `collisionPadding`, etc.) on Positioner and `className`/content props on Popup; `asChild` shimmed in the wrapper (TooltipTrigger pattern) so call sites stay untouched · **Verdict: complete and clean** — all four affected apps typecheck and the Radix sweep is clean. The migration had been started and left mid-flight by a previous agent (usage limit); this agent verified the written `popover-base.tsx` against the installed d.ts, fixed one type error, finalized, and re-verified.

## Changed

- `packages/ui/src/components/popover.tsx` — migrated from `radix-ui` to `@base-ui/react/popover`. Content split into `Portal > Positioner > Popup`; positioning props default to `align="center"`, `side="bottom"`, `sideOffset=4`; animation classes moved from `data-[state=open|closed]` to `data-open`/`data-closed`; `origin-(--radix-popover-content-transform-origin)` → `origin-(--transform-origin)`. `PopoverTrigger` gained a deprecated Radix-compat `asChild` prop that maps to Base UI `render` (matching `TooltipTrigger` in `tooltip.tsx`). `PopoverAnchor` was **removed** — Base UI Popover has no Anchor part (positioning anchors come from the Positioner `anchor` prop), and no consumer used it. Fixed during verification: the leftover props spread onto `Popup` needed a cast to `React.ComponentProps<typeof PopoverPrimitive.Popup>` because Positioner/Popup state types (e.g. `anchorHidden` present only on Positioner state) are structurally incompatible.
- Repointed consumers, then flipped back to `components/popover` after finalization (26 files):
  - `apps/expense-tracker/components/pages/transactions/transactions-filter-popover.tsx`
  - `apps/web/components/showcase/overlays-section.tsx`
  - `apps/cortex-ai/components/documents/document-ingest-error-badge.tsx`
  - `apps/billezy/components/participant-picker.tsx`
  - `packages/ui/src/components/data-table/data-table-filter-menu.tsx`, `-filter-menu-item.tsx`, `-filter-menu-date-input.tsx`, `-filter-menu-select-input.tsx`, `-filter-date-input.tsx`, `-filter-field.tsx`, `-filter-list.tsx`, `-faceted-filter.tsx`, `-date-filter.tsx`, `-slider-filter.tsx`, `-sort-list.tsx`, `-sort-list-item.tsx`, `-view-options.tsx`
  - `packages/ui/src/components/elevenlabs/voice-picker.tsx`
  - `packages/ui/src/components/date-time-picker.tsx`, `date-picker.tsx`, `currency-picker.tsx`, `country-dropdown.tsx`, `country-combobox.tsx`, `ColorPicker.tsx`, `year-picker.tsx`, `faceted.tsx`
- All consumer call sites were audited for Radix-only props: `asChild` on `PopoverTrigger` is everywhere, handled by the wrapper shim; no `forceMount`, `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`, or `modal` usage found. `--anchor-width` CSS var usages (`w-(--anchor-width)`, `w-[var(--anchor-width)]`, `min-w-[--anchor-width]`) still work — Base UI sets `--anchor-width` on the Positioner, which is an ancestor of the Popup, so it inherits.

## Left alone

- `packages/ui/src/components/animate-ui/primitives/radix/popover.tsx` (animate-ui/* is out of scope)
- Everything else in `packages/ui` — only files importing `components/popover` were touched.
- No other components imported `PopoverAnchor`.

## Behavior changes

- `PopoverAnchor` is gone from the public exports (unused anywhere).
- Extra props spread on `PopoverContent` now land on the Base UI **Popup** (after the Positioner props are extracted) instead of Radix Content — equivalent for HTML attrs (`id`, `className`); positioning props (`side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `sticky`, …) land on the Positioner.
- DOM structure gains one extra wrapper `<div>` (the Positioner) between the portal and the popup; `data-side`/`data-align` attrs now sit on the Popup same as before via state, but the wrapper div itself is new.
- The open/closed state attributes are `data-open`/`data-closed` (Base UI) instead of `data-state=open|closed` (Radix), so any external CSS targeting `data-state` on popover content would stop matching (none found in the components themselves).
- `asChild` on `PopoverTrigger` now renders the child via Base UI `render`; the trigger's `data-slot="popover-trigger"` attribute is not applied to the child in that branch (same as the tooltip shim).

## Verify by hand

- Open any popover (e.g. transactions filter, view options, date pickers in web): opens/closes, positioned correctly with `align="end"`/`"start"` variants, animation plays on both open and close.
- Check the `w-(--anchor-width)` popovers (sort list, voice picker, country dropdown) width still matches the trigger.
- Keyboard: Escape closes; focus returns to trigger.
- `country-dropdown` uses a plain (non-`asChild`) styled trigger with a forwarded ref — confirm the ref/button behavior still works.
