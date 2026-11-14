# sidebar-menu-sub

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: clean, typecheck green, call-site API unchanged.

## Changed

- `packages/ui/src/components/sidebar-menu-sub.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `SidebarMenuSubButton` (a): `const Comp = asChild ? Slot.Root : "a"` rewritten to `useRender({ defaultTagName: "a", render, props: {...} })`.
  - `asChild` marked `/** @deprecated Radix compat — Base UI uses `render`. */`; children destructured and only spread into props when not composing.
  - All classNames, `data-slot`/`data-sidebar`/`data-size`/`data-active`, the `--skeleton-width` logic in `SidebarMenuSkeleton`, `"use client"`, and exports byte-identical.

## Left alone

- `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubItem` — plain elements, no Slot.

## Behavior changes

- None for valid `asChild` usage (e.g. wrapping Next.js `<Link>` still merges all props onto the anchor).

## Verify by hand

- Sub-nav with `<SidebarMenuSubButton asChild><Link …>` — link renders as the anchor with active/hover styles intact (`data-[active=true]:bg-sidebar-accent`).
