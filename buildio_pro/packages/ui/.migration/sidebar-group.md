# sidebar-group

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: clean, typecheck green, call-site API unchanged.

## Changed

- `packages/ui/src/components/sidebar-group.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `SidebarGroupLabel` (div) and `SidebarGroupAction` (button): `const Comp = asChild ? Slot.Root : "tag"` rewritten to `useRender({ defaultTagName: "tag", render, props: {...} })`.
  - `asChild` marked `/** @deprecated Radix compat — Base UI uses `render`. */`; children destructured so `children: undefined` is never spread into props when composing onto a render element.
  - All classNames, `data-slot`/`data-sidebar` attributes, `"use client"`, and exports byte-identical.

## Left alone

- `SidebarGroup` / `SidebarGroupContent` — plain divs, no Slot.
- package.json / components.json — no dependency edits per instructions.

## Behavior changes

- None for valid `asChild` usage (Slot-style prop merge onto child preserved via useRender's props merge, incl. className join and handler composition). Invalid `asChild` (no valid element child) previously rendered nothing/warned via Slot; now falls back to the default tag — strictly more forgiving.

## Verify by hand

- apps/web showcase sidebar: group label/action render with the same classes; `asChild` usage (if any) renders the child element with `data-sidebar="group-label"` / `"group-action"` merged onto it.
