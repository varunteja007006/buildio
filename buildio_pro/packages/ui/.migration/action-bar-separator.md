# action-bar-separator

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: trivial clean migration, typecheck green.

## Changed

- `packages/ui/src/components/action-bar-separator.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const SeparatorPrimitive = asChild ? Slot : "div"` + JSX rewritten to `useRender({ defaultTagName: "div", render, props: {...} })`.
  - `children` destructured; only spread into props when not composing.
  - `role="separator"`, `aria-orientation`, `aria-hidden`, `data-slot`, and all classNames (incl. the `in-data-[slot=action-bar-selection]` conditional sizing) byte-identical.

## Behavior changes

- None.

## Verify by hand

- Shared verify item with action-bar-selection: vertical separator between action bar groups is `h-6 w-px`; inside the selection chip it shrinks to `h-4` with `ml-0.5`.
