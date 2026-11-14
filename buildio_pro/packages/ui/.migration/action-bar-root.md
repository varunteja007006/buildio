# action-bar-root

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: clean for the Slot path; ⚠ direction handling left on Radix (see FLAG).

## Changed

- `packages/ui/src/components/action-bar-root.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const RootPrimitive = asChild ? Slot : "div"` + JSX rewritten to `useRender({ defaultTagName: "div", render, enabled, ref: composedRef, props: {...} })`.
  - `enabled: mounted && open && portalContainer != null` — the hook is called BEFORE the `if (!portalContainer || !open) return null` early return so hook order stays stable across open/close transitions (calling useRender after the early return would throw "more hooks than previous render").
  - `children` destructured out of props; only spread into props when not composing (`...(render ? {} : { children })`).
  - Portal via `ReactDOM.createPortal(element, portalContainer)` unchanged; role/aria/data attributes, className, computed style (side/align offsets), context provider, Escape-key handling — byte-identical logic.

## FLAG

- `import { useDirection } from "@radix-ui/react-direction"` LEFT ON RADIX. Base UI's `useDirection()` takes no argument and reads Base UI's own `DirectionContext`, which is never populated in this repo (the shared wrapper `packages/ui/src/components/direction.tsx` is Radix-based and untouched by this migration). A trivial swap would drop the `dir` prop override and always return `'ltr'`. Mappable once `direction.tsx` migrates to `@base-ui/react/direction-provider`; then change to `const dir = dirProp ?? useDirection()`. No app or call site passes `dir`/`DirectionProvider` today, so zero behavior delta in practice.

## Behavior changes

- None for valid `asChild` usage; Slot-style merge (className join, composed ref, handlers) preserved by useRender.

## Verify by hand

- expense-tracker expenses/income tables: select rows → action bar slides up from bottom with zoom-in animation, Escape closes it.
