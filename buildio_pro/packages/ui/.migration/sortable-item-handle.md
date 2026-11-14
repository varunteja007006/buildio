# sortable-item-handle

2026-11-14 — Slot → `useRender` composition. Verdict: clean 1:1, all typechecks green, wrapper API unchanged. NO FLAG: dnd-kit `attributes`/`listeners` are spread props; Slot is this component's own `asChild` API, not an external library contract.

## Changed

- `packages/ui/src/components/sortable-item-handle.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const HandlePrimitive = asChild ? Slot : "button"` → `useRender({ render: isSlot ? children : <button data-slot="sortable-item-handle" />, ref: composedRef, props: {...} })`, `isSlot = asChild && React.isValidElement(children)`.
  - `children` destructured out of `itemHandleProps` and re-added in `props` only when not composing (mirrors Slot consuming children as the clone target without forwarding).
  - `asChild` marked deprecated (Radix compat).
  - Prop order preserved: `type="button"` / `aria-controls` / data-attrs → `itemHandleProps` → dnd-kit `attributes`/`listeners` → `className` → `disabled`; `composedRef` (activator-node registration when disabled) via the `ref` param. classNames byte-identical.

## Left alone

- `sortable-context.tsx`, `sortable.tsx` barrel.
- Consumers `data-table-filter-item.tsx` / `data-table-sort-list-item.tsx` use `<SortableItemHandle asChild>` — covered by the shim.

## Behavior changes

- None for element children. Edge: `asChild` with a non-element child now renders the default `<button>` (Radix Slot had a different fallback) — not hit by any consumer.

## Verify by hand

- `expense-tracker` filter list: grab-and-drag a chip by the handle icon only (item body is not a handle); disabled filter's handle is inert but still registers the activator node.
