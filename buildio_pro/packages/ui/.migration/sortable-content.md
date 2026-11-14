# sortable-content

2026-11-14 — Slot → `useRender` composition. Verdict: clean 1:1, all typechecks green, wrapper API unchanged. NO FLAG: the Slot usage is this component's own `asChild` API, not an external library contract — the sortable stack is `@dnd-kit/sortable` (props-only, no Slot dependency) + local `sortable-context.tsx`.

## Changed

- `packages/ui/src/components/sortable-content.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const ContentPrimitive = asChild ? Slot : "div"` → `useRender({ render: isSlot ? children : <div data-slot="sortable-content" />, ref, props: {...} })`, `isSlot = asChild && React.isValidElement(children)`.
  - Hook called unconditionally at top level (rules of hooks); `withoutSlot` handled by rendering `children` directly instead of the element, not by skipping the hook.
  - `children` in `props` only when not composing.
  - `asChild` marked deprecated (Radix compat).
  - `SortableContext` wiring, context provider, `data-slot`, prop order (`data-slot` then `contentProps`), and export byte-identical.

## Left alone

- `sortable-context.tsx` (not in scope), `sortable.tsx` re-export barrel, data-table consumers.
- Consumers `data-table-sort-list.tsx` / `data-table-filter-list.tsx` use `<SortableContent asChild>` with element children — covered by the shim, no edits.

## Behavior changes

- None for element children. Edge: `asChild` with a non-element child now renders the default div (Radix Slot had a different multi/invalid-child fallback) — not hit by any consumer.

## Verify by hand

- `expense-tracker` transactions filter list + sort list (data-table drag surfaces): drag reordering still works, wrapper div present with `data-slot="sortable-content"`.
