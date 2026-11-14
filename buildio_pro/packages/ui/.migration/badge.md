# badge

2026-11-14 — Slot → `useRender` composition with deprecated `asChild` shim (button.tsx pattern). Verdict: clean 1:1, all typechecks green, wrapper API unchanged.

## Changed

- `packages/ui/src/components/badge.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `Badge`: `const Comp = asChild ? Slot.Root : "span"` ternary → `useRender({ render: isSlot ? children : <span data-slot="badge" />, props: {...} })`, with `isSlot = asChild && React.isValidElement(children)`.
  - `children` now destructured explicitly; included in `props` only when NOT composing (prevents clobbering the render element's children).
  - `asChild` marked `/** @deprecated Radix compat — Base UI uses `render`. */`.
  - cva variants, classNames, `data-slot`/`data-variant` ordering, and `export { Badge, badgeVariants }` byte-identical.

## Left alone

- `package.json` / catalog — no dependency edits.
- No app call sites use `<Badge asChild>` (grepped apps/*), so shim is exercised only if future call sites opt in.

## Behavior changes

- None for existing call sites (all render the plain span path).
- Edge case: `asChild` with a non-element child (string) previously rendered via Slot's fragment fallback; now renders the default `<span data-slot="badge">` with the child inside. Not hit by any consumer.

## Verify by hand

- `apps/web` showcase: badges render identical (default/outline/ghost variants, icon badge).
- If any `asChild` badge exists after this lands: confirm className joins (badge variants + child's own class) like Slot did.
