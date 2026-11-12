# collapsible

2026-11-11/12 — strategy: transformation engine performed by a sibling subagent that finalized the wrapper in place but was cancelled (T3 server restart) before flipping consumer imports back and writing its report. The orchestrator completed the run manually. Verdict: migrated cleanly to `@base-ui/react/collapsible`.

## Changed

- `packages/ui/src/components/collapsible.tsx` (finalized in place by the cancelled agent; verified by the orchestrator):
  - Import: `Collapsible` from consolidated `radix-ui` → `@base-ui/react/collapsible` (Root/Trigger/Panel parts).
  - Class-mapping renames: `data-[state=open]` → `data-open` (Base UI presence attributes), `data-[state=closed]` selectors dropped where present.
  - Exports `Collapsible`, `CollapsibleTrigger`, `CollapsiblePanel`-equivalent names kept identical.
- Consumer imports flipped back from `collapsible-base` to `@workspace/ui/components/collapsible` (13 files):
  - `apps/book/components/folder-tree.tsx`
  - `apps/cortex-ai/components/chat/tool-calls.tsx`, `apps/cortex-ai/components/documents/documents-tree-folder.tsx`, `apps/cortex-ai/components/documents/documents-tree-row.tsx`, `apps/cortex-ai/components/nav-main.tsx`
  - `apps/expense-tracker/components/organisms/sidebar/nav-main.tsx`
  - `apps/web/components/showcase/navigation-section.tsx`
  - `packages/ui/src/components/ai-elements/{chain-of-thought,reasoning,sources,task,tool}.tsx`
  - `packages/ui/src/components/trace.tsx` (untracked file, discovered consuming the transient `collapsible-base` path; flipped with the rest)
- Leftover scan `grep -n "radix-ui|@radix-ui"` on this component's files: clean.

## Left alone

- `animate-ui/*` collapsible variants — registry-owned.

## Behavior changes

- Panel open/close data attributes change from `data-state=open|closed` to `data-open`/`data-closed` — only matters for consumer CSS targeting those attributes; none found in the workspace.
- Base UI Panel `keepMounted` semantics differ from Radix `forceMount`; wrapper usage keeps default unmount-on-close behavior.

## Verify by hand

- Cortex-ai nav sidebar sections expand/collapse with animation; chevron rotates.
- Folder trees (book, cortex-ai documents) open nested folders on click.
- ai-elements reasoning/chain-of-thought panels expand and collapse; keyboard focus follows the trigger.
