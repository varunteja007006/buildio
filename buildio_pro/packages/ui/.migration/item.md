# item

2026-11-14 — Slot → `useRender` migration. Verdict: clean, single occurrence (`Item` only — the composite's other sub-components never used Slot); no app call site uses `asChild` on Item (checked `apps/web/components/showcase/primitives-section.tsx` — plain div children only).

## Changed

- `packages/ui/src/components/item.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `Item`: `const Comp = asChild ? Slot.Root : "div"` → `useRender({ render: isChildRender ? children : <div data-slot="item" />, props: {...} })`.
  - `data-variant`/`data-size` moved into `props` so they still apply when composing over a child element (Slot passed them through too).
  - `children` now destructured and conditionally excluded from `props` when `asChild` + valid element child.
  - `asChild` kept as deprecated Radix-compat prop with the standard deprecation marker (button.tsx convention).
- Untouched sub-components (no Slot usage): `ItemGroup`, `ItemSeparator`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`. All classNames/variants/exports byte-identical.

## Left alone

- package.json / pnpm-workspace.yaml — no dependency edits.
- `apps/web/components/showcase/primitives-section.tsx` — no `asChild` on Item; untouched.

## Behavior changes

- None for current call sites. Edge case: `asChild` with non-element child now falls through to the default `<div data-slot="item">` path instead of Radix Slot's span fallback.

## Verify by hand

- `apps/web` showcase → primitives → Item example: outline border, icon media square, title/description typography all unchanged; `ItemSeparator` still a hairline between rows.
