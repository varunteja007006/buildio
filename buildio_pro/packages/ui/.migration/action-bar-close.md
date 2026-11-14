# action-bar-close

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: clean, typecheck green, call-site API unchanged.

## Changed

- `packages/ui/src/components/action-bar-close.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const ClosePrimitive = asChild ? Slot : "button"` + JSX rewritten to `useRender({ defaultTagName: "button", render, props: {...} })`.
  - `asChild` marked `/** @deprecated Radix compat — Base UI uses `render`. */` on the local props interface; `children` destructured and only spread into props when not composing.
  - `type="button"`, `data-slot`, the user `onClick` → `defaultPrevented` → `onOpenChange(false)` chain, and classNames byte-identical.

## Behavior changes

- None for valid `asChild` usage; useRender composes the child's onClick with `onCloseClick` like Slot did.

## Verify by hand

- Click the ✕ in the bulk-selection action bar (expense-tracker / cortex-ai documents) → bar closes.
