# marker

2026-11-14 — Slot → `useRender` migration. Verdict: clean, single occurrence (`Marker` only; `MarkerIcon`/`MarkerContent` never used Slot); no app call site uses `asChild` on Marker (checked `apps/web/components/showcase/primitives-section.tsx`).

## Changed

- `packages/ui/src/components/marker.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `Marker`: `const Comp = asChild ? Slot.Root : "div"` → `useRender({ render: isChildRender ? children : <div data-slot="marker" />, props: {...} })`.
  - `data-variant` moved into `props` so it still applies when composing over a child element.
  - `children` now destructured and conditionally excluded from `props` when `asChild` + valid element child.
  - `asChild` kept as deprecated Radix-compat prop with the standard deprecation marker (button.tsx convention).
- `markerVariants` export, all classNames/variants byte-identical.

## Left alone

- package.json / pnpm-workspace.yaml — no dependency edits.
- `apps/web/components/showcase/primitives-section.tsx` — no `asChild` on Marker; untouched.

## Behavior changes

- None for current call sites. Edge case: `asChild` with non-element child now falls through to the default `<div data-slot="marker">` path instead of Radix Slot's span fallback.

## Verify by hand

- `apps/web` showcase → primitives: `Marker variant="separator"` still shows hairlines before/after the content; `variant="border"` still shows the bottom border; icon + content inline layout intact.
