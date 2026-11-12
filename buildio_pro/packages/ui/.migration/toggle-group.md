# toggle-group

2026-11-11 — strategy: transformation engine, performed by a sibling subagent that finalized the wrapper in place but hit a free-usage limit before writing its report and before flipping consumer imports back. The orchestrator completed the run manually. Verdict: migrated cleanly to `@base-ui/react/toggle-group`.

## Changed

- `packages/ui/src/components/toggle-group.tsx` (finalized in place by the cancelled agent; verified by the orchestrator):
  - Imports: `ToggleGroup` from consolidated `radix-ui` → `@base-ui/react/toggle-group`, plus `Toggle` from `@base-ui/react/toggle` for the item part (Base UI has no `ToggleGroup.Item`; items are rendered with `Toggle`).
  - `ToggleGroupPrimitive.Root` → callable `ToggleGroupPrimitive`; `ToggleGroupPrimitive.Item` → `TogglePrimitive`.
  - Prop types: `ToggleGroupPrimitive.Props` / `TogglePrimitive.Props`.
  - `toggleVariants` import kept at the ORIGINAL path `@workspace/ui/components/toggle` (race-proofed against the concurrent toggle migration).
- Consumer imports flipped back from `toggle-group-base` to `@workspace/ui/components/toggle-group` (3 files):
  - `apps/cortex-ai/components/documents/documents-view.tsx`
  - `apps/expense-tracker/components/pages/transactions/transactions-filter-toolbar.tsx`
  - `apps/web/components/showcase/navigation-section.tsx`
- Leftover scan `grep -n "radix-ui|@radix-ui"` on this component's files: clean.

## Left alone

- `packages/ui/src/components/toggle.tsx` — its own migration (sibling agent, completed with report).
- `packages/ui/src/components/animate-ui/primitives/{radix,base}/*` — registry-owned.

## Behavior changes

- Base UI ToggleGroup items are `Toggle` instances; `pressed` state semantics replace `data-state=on`. The shared `toggleVariants` in toggle.tsx was already renamed to `data-pressed:*` by the toggle migration, so item styling is consistent.
- Typeahead/multi-select keyboard behavior follows Base UI's roving focus; the `spacing` prop handling in the wrapper is unchanged.

## Verify by hand

- Transactions filter toolbar: toggle filter chips on/off; pressed styling (bg-accent) appears/disappears.
- Documents view (cortex-ai): grid/list view switch via toggle group; exactly the selected value is pressed.
- Web showcase navigation section: multiple toggle items can be toggled independently.
