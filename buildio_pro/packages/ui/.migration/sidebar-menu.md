# sidebar-menu

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: clean, typecheck green, call-site API unchanged.

## Changed

- `packages/ui/src/components/sidebar-menu.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `SidebarMenuButton` (button): `const Comp = asChild ? Slot.Root : "button"` rewritten to `useRender({ defaultTagName: "button", render, props: {...} })`; the rendered `button` element (a ReactElement) is still passed as the child of `<TooltipTrigger asChild>` — tooltip.tsx is already Base UI (`render={children}` shim) so composition is preserved end-to-end.
  - `SidebarMenuAction` (button): same rewrite.
  - Both `asChild` props marked `/** @deprecated Radix compat — Base UI uses `render`. */`; children destructured so it is only spread into props when NOT composing (`...(render ? {} : { children })`).
  - cva `sidebarMenuButtonVariants`, all classNames, `data-slot`/`data-sidebar`/`data-size`/`data-active`, `"use client"`, and exports byte-identical.

## Left alone

- `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuBadge` — plain elements, no Slot.
- `@workspace/ui/components/tooltip` — already migrated by another agent.

## Behavior changes

- None for valid `asChild` usage; props merge (className join, ref, handlers) matches Slot semantics via useRender.

## Verify by hand

- Sidebar menu button with tooltip: hover shows tooltip to the right when collapsed (desktop); click navigates.
- `isActive` styling: `data-[active=true]:bg-sidebar-accent` still applies.
