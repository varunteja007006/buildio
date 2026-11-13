# select

2026-11-14 · Strangler-fig (select-base.tsx → repoint consumers → typecheck → finalize into select.tsx, flip imports back) · **DONE — select fully migrated to Base UI 1.9.0, all affected apps typecheck clean, zero radix-ui references remain in the wrapper or its consumers.** Third attempt (two earlier sessions died on usage limits). Sibling migrations (alert-dialog, data-table family, ai-elements, dropdown-menu) were/are in flight concurrently; their pre-existing errors were ignored per instructions.

## Changed

- `packages/ui/src/components/select.tsx` — rewritten from `radix-ui` Select to `@base-ui/react/select`. Every part mapped against the installed d.ts files (root/trigger/value/icon/portal/positioner/popup/list/item/item-indicator/item-text/group/group-label/separator/scroll-up-arrow/scroll-down-arrow) and the Base UI docs page. Export names are byte-identical: Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue.
- Part mapping: Root→Root, Group→Group, Value→Value, Trigger→Trigger (Icon child now via Base UI `render={<ChevronDownIcon/>}` instead of Radix `Icon asChild`), Content→Portal+Positioner+Popup+List (Radix Content/Viewport have no Base UI single counterpart), Label→GroupLabel (all 3 usages are inside SelectGroup; GroupLabel auto-associates with the parent group), Item→Item (children still wrapped in ItemText; ItemIndicator span kept), Separator→Separator, ScrollUpButton→ScrollUpArrow, ScrollDownButton→ScrollDownArrow.
- `Select` is now generic (`Value = string`, `Multiple`), matching Radix's string-only values; `onValueChange` keeps the Base UI second `eventDetails` param and is typed with a Radix-style `bivarianceHack` so narrow call-site annotations (`(value: "asc" | "desc") => void`, `(value: "true" | "false") => void` in data-table) keep compiling.
- `SelectContent` keeps a deprecated Radix-compat `position` prop ("item-aligned" | "popper"); "popper" maps to `alignItemWithTrigger={false}` on the Positioner. `alignItemWithTrigger` is also passable directly (spread wins).
- Radix vars/attrs renamed to Base UI per d.ts: `--radix-select-content-available-height` → `--available-height`, `--radix-select-content-transform-origin` → `--transform-origin`, `--radix-select-trigger-width/height` → `--anchor-width/--anchor-height` (List in popper mode), `data-[state=open/closed]` → `data-open`/`data-closed` (side/align attrs exist in both libs, kept as `data-[side=…]`).
- Consumers repointed then flipped back (transient select-base step, now deleted): 33 files across apps/expense-tracker, apps/cortex-ai, apps/billezy, apps/book, apps/scribble, apps/web, apps/housie-game, packages/ui (data-table/*, forms/FormSelect, ai-elements/prompt-input, currency-picker).
- `packages/ui/src/components/data-table/data-table-filter-item.tsx` + `data-table-sort-list-item.tsx` — `min-w-(--radix-select-trigger-width)` → `min-w-(--anchor-width)` (var no longer exists under Base UI).

## Left alone

- `packages/ui/src/components/ai-elements/code-block.tsx` (untracked, registry-owned) — still imports `@workspace/ui/components/select`; untouched and typechecks against the new wrapper because export names are identical and it only uses align/ComponentProps passthroughs. `packages/ui/src/components/ai-elements/{trace,use-highlighted-code,highlighter}.tsx`, `animate-ui/*`, every package.json, pnpm-lock.yaml, globals.css, components.json — untouched per rules.
- `packages/ui/src/components/action-bar-selection.tsx` still imports `@radix-ui/react-slot` — it doesn't use this Select component (own Slot-based primitive), out of scope.
- dropdown-menu.tsx (Radix, sibling finalizing), button-group.tsx (`data-slot=select-trigger` selector still valid — my wrapper keeps the same data-slot), date-picker/country-dropdown family (they don't actually import select).
- All Tailwind class strings kept byte-identical except the mandatory var/data-attr renames above.

## Behavior changes

- Trigger value display: Radix rendered the selected item's ItemText; Base UI Value renders the raw value (or its `items` lookup, not used here). Identical for the string values every consumer uses; object values would display serialized instead of item label.
- Popup positioning: default is Base UI's `alignItemWithTrigger` overlap mode (selected item aligns over trigger text, mouse-only, viewport-dependent) vs Radix's item-aligned mode — close UX, not pixel-identical. `position="popper"` sites (data-table-filter-item) get true non-overlap popper.
- Scroll arrows: Base UI ScrollArrows don't render on touch input (Radix rendered them); they mount only when scrollable (same as Radix).
- `onValueChange` now receives Base UI eventDetails as a 2nd arg (additive; existing single-arg handlers fine). Radix's never-emitted null-clear value type is not surfaced in the wrapper (no consumer has clearable null items); Base UI Root still supports it for future direct use.
- Group labels inside the popup are now real accessible group labels (Base UI GroupLabel links aria-labelledby automatically; Radix ones were purely visual here).
- Highlight styling: item `focus:bg-accent` class kept verbatim, but Base UI highlights via `data-highlighted` (real focus does land on the highlighted item — `tabIndex` when highlighted), so keyboard navigation still visually highlights.

## Verify by hand

- Trigger opens/closes, chevron rotates placeholder state (`data-[placeholder]` styling of muted value text).
- Default (item-aligned) select: popup overlaps trigger, Esc/outside click closes, keyboard arrows + typeahead navigate, Enter/Space selects, selected item shows check indicator.
- `position="popper"` (data-table filter join operator): popup sits below trigger, min-width matches trigger width.
- Grouped selects (support page, donate page, web showcase, currency-picker): group label renders inside the group, items selectable, disabled item (web showcase SvelteKit) unselectable.
- Scrollable long lists (cortex-ai model pickers, currency-picker ~100 currencies): up/down scroll arrows appear/disappear.
- FormSelect + `aria-invalid` trigger styling, `size="sm"` trigger height, controlled `open` (data-table-sort-list direction selector).
