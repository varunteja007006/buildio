# separator

2026-11-12 — strategy: transformation engine on a `-base` file left by an interrupted sibling migration; wrapper was pristine vs the radix golden except for the Radix-only `decorative` prop. Verdict: migrated cleanly to `@base-ui/react/separator`, finalized in place. This run was completed manually by the orchestrator after the original subagent hit a free-usage limit mid-flight.

## Changed

- `packages/ui/src/components/separator.tsx` (folded from `separator-base.tsx`):
  - Import: `Separator` from consolidated `radix-ui` → `@base-ui/react/separator` (verified `Separator.d.ts`: single callable part, renders `<div>`, `orientation` prop only).
  - Dropped the Radix-only `decorative` prop and its pass-through (Base UI's Separator has no `decorative`; it is always decorative). No consumer in the workspace passes `decorative`.
  - `SeparatorPrimitive.Root` → callable `SeparatorPrimitive`.
  - Classes byte-identical: `data-[orientation=horizontal|vertical]` selectors kept — verified Base UI renders `data-orientation` (`SeparatorDataAttributes.d.ts`). Export `Separator` unchanged. File is 25 lines.
- Consumers — the interrupted run had repointed only `apps/web/components/showcase/primitives-section.tsx` to `separator-base`; this run flipped it back. All other consumers (book pages, cortex-ai auth pages + audit dialogs + dashboard-header, expense-tracker dashboard-shell, portfolio experience, web showcase demos, and internal `button-group`/`data-table-*`/`elevenlabs`/`field`/`item`/`sidebar-content` wrappers) never moved.
- Leftover scan `grep -n "radix-ui|@radix-ui"` on this component's files: clean.

## Left alone

- `apps/cortex-ai/components/audit-logs/*.tsx` — they consume scroll-area (not part of this pilot) alongside separator; only the separator import state was touched.
- `animate-ui/*` — registry-owned.

## Behavior changes

- `decorative` no longer accepted (was Radix-specific; no callers used it).
- Base UI Separator renders a `<div>` (Radix also rendered a div); `orientation` and rendered `data-orientation` match.

## Verify by hand

- Horizontal separators in the book home page / cortex-ai auth pages render 1px lines.
- A vertical separator (sidebar layouts) renders as a 1px column.
- No layout shift where separators sit inside flex rows.
