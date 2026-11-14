# sortable-item

2026-11-14 — Slot → `useRender` composition. Verdict: clean 1:1, all typechecks green, wrapper API unchanged. NO FLAG: dnd-kit `attributes`/`listeners` are spread props onto our element; Slot is this component's own `asChild` API, not an external library contract.

## Changed

- `packages/ui/src/components/sortable-item.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const ItemPrimitive = asChild ? Slot : "div"` → `useRender({ render: isSlot ? children : <div data-slot="sortable-item" />, ref: composedRef, props: {...} })`, `isSlot = asChild && React.isValidElement(children)`.
  - `children` now destructured out of `itemProps` and re-added in `props` only when not composing — mirrors Radix Slot, which consumed `children` as the clone target and did NOT forward it to the child.
  - `asChild` marked deprecated (Radix compat). Element returned by `useRender` wrapped in `SortableItemContext.Provider` as before.
  - All prop spread order preserved: `id`/data-attrs → `itemProps` → dnd-kit `attributes`/`listeners` → `style` → `className`; `composedRef` via the `ref` param (setNodeRef/setActivatorNodeRef composition unchanged). classNames byte-identical (including the pre-existing `data-dragging:cursor-grabbing` quirk — left as-is).

## Left alone

- `sortable-context.tsx`, `sortable.tsx` barrel, dnd-kit usage.
- Consumers `data-table-filter-item.tsx` / `data-table-sort-list-item.tsx` use `<SortableItem asChild>` — covered by the shim.

## Behavior changes

- None for element children. Ref composition: useRender applies `composedRef` to the rendered element (same node Slot cloned onto).

## Verify by hand

- `expense-tracker` filter list: drag a filter chip by its handle — transforms/transitions apply, `data-dragging` opacity-50 shows, item drops back cleanly.
