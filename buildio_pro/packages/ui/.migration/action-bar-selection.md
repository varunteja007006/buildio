# action-bar-selection

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: trivial clean migration, typecheck green.

## Changed

- `packages/ui/src/components/action-bar-selection.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"` (also added the missing `import * as React from "react"` — needed for `React.isValidElement`).
  - `const SelectionPrimitive = asChild ? Slot : "div"` + JSX rewritten to `useRender({ defaultTagName: "div", render, props: {...} })`.
  - `children` destructured; only spread into props when not composing.
  - `data-slot` and classNames byte-identical (`in-data-[slot=action-bar-separator]` peer styling lives on the separator file, untouched).

## Behavior changes

- None.

## Verify by hand

- Shared verify item with action-bar-separator: selection chip + separator inside the action bar render with unchanged spacing (separator's `in-data-[slot=action-bar-selection]` classes still match).
