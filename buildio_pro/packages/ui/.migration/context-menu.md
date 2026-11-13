# context-menu

2026-11-13 · strategy: wrapper-level port of the shadcn context-menu wrapper from Radix `context-menu` parts to Base UI `@base-ui/react/context-menu` (which delegates to the shared `menu` parts), keeping every export name identical and shimming `asChild` on the Trigger · verdict: ✅ migrated — wrapper verified against the installed d.ts files, both consumers repointed and `pnpm --filter=web typecheck` passes with zero errors in files touched by this migration. The migration had been interrupted by a usage limit after the previous agent created `context-menu-base.tsx` without repointing any consumers; this session verified/finished the base file and completed the cutover.

## Changed

- `packages/ui/src/components/context-menu-base.tsx` (created by the previous agent, verified and fixed here, then moved to `context-menu.tsx`):
  - Import source: `radix-ui` → `@base-ui/react/context-menu`.
  - Part mapping (all exports keep their names): `Root`→`Root`, `Trigger`→`Trigger`, `Group`→`Group`, `Portal`→`Portal`, `Sub`→`SubmenuRoot`, `RadioGroup`→`RadioGroup`, `SubTrigger`→`SubmenuTrigger`, `SubContent`→`Portal > Positioner > Popup`, `Content`→`Portal > Positioner > Popup`, `Item`→`Item`, `CheckboxItem`→`CheckboxItem` (+`CheckboxItemIndicator` for the old `ItemIndicator`), `RadioItem`→`RadioItem` (+`RadioItemIndicator`), `Label`→`GroupLabel`, `Separator`→`Separator`. `ContextMenuShortcut` stays a plain `<span>`.
  - Fix vs d.ts: `SubmenuTrigger` highlight/open styling corrected from `data-open:*` to Base UI's actual `data-popup-open:*` attribute (`MenuSubmenuTriggerDataAttributes` exposes `popup-open` / `highlighted` / `disabled`; there is no `data-open` on the trigger).
  - Fix vs repo convention: Popup animation classes changed from unconditional `animate-in fade-in-0 zoom-in-95` to `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` (matches `popover-base.tsx` / `combobox-content.tsx`).
  - Radix CSS vars swapped to Base UI equivalents: `max-h-(--available-height)` and `origin-(--transform-origin)` (both confirmed in `MenuPositionerCssVars`).
  - Radix state selectors swapped: `data-[state=open/closed]:*` → `data-open:*` / `data-closed:*`; `focus:bg-accent` → `data-highlighted:bg-accent` (and `data-highlighted:text-accent-foreground`).
  - `ContextMenuTrigger` now renders a `<div>` (Base UI) instead of Radix's `<span>`, and gained a deprecated `asChild` shim (same pattern as `TooltipTrigger` in `tooltip.tsx`): when `asChild` is passed with a valid element child it forwards to Base UI's `render` prop.
- `packages/ui/src/components/context-menu.tsx`: content replaced with the migrated file; `context-menu-base.tsx` deleted.
- `apps/web/components/showcase/overlays-menus-section.tsx`: two no-op `onSelect={() => undefined}` on `ContextMenuItem` changed to `onClick={() => undefined}` (Base UI `MenuItem` has no `onSelect`; `onClick` + default `closeOnClick` matches Radix behavior for these no-ops). No other call-site changes needed — this file uses `ContextMenuTrigger` without `asChild`.
- `packages/ui/src/components/logo.tsx`: no code change; imports kept pointing at `components/context-menu`, and its `<ContextMenuTrigger asChild><div …>` usage works through the wrapper's `asChild` → `render` shim.

## Left alone

- `animate-ui/*` registry-owned files that reference context-menu (not touched per policy).
- `packages/ui/src/components/dropdown-menu.tsx` (sibling agent's migration, even though it appears in the same showcase file).
- No `package.json`, lockfile, `globals.css`, `components.json`, or untracked-file changes; no dependency additions.
- `ContextMenuPortal`, `ContextMenuGroup`, `ContextMenuRadioGroup`, `ContextMenuSub` wrappers remain exported even though `ContextMenuContent` embeds its own `Portal > Positioner` — kept for API compatibility with existing/registry call sites.

## Behavior changes

- `ContextMenuTrigger` renders a `div` instead of a `span`; consumers relying on inline-block span semantics may need a display class (the showcase and logo call sites pass explicit flex/inline-block classes, so unaffected).
- Item highlight styling now driven by `data-highlighted` instead of `:focus`/`data-[state=open]`; disabled semantics unchanged (`data-disabled` exists on Base UI items too, but the wrapper kept the generic `data-[disabled]` class which Base UI also sets as `data-disabled` — verify visually).
- Exit animations run on `data-closed` + Base UI's `data-ending-style` timing; Base UI keeps the popup mounted during the exit animation, so no `keepMounted` change was needed.
- `onSelect` no longer exists on items: Base UI uses `onClick` (with `closeOnClick` defaulting to closing the menu, mirroring Radix). Any consumer passing `onSelect` would be a type error — none do today.
- Submenu root: Base UI `SubmenuRoot` accepts Radix's `Sub`-style children; `onOpenChange`/`open` semantics map directly.

## Verify by hand

- In the web showcase ("Menus & Command" section): right-click the dashed ContextMenu area — menu opens on the pointer, items highlight on hover/keyboard, checkbox toggle works, `⌘P` shortcut label shows, menu closes after item click.
- Right-click a logo rendered via `LogoBrandDownload` (currently unreferenced by any app — exercised only via registry/consumer adoption): context menu opens on the wrapped element via the `asChild` shim, download items fire `onClick`.
- Open a `ContextMenuSub` submenu (no in-repo consumer): chevron shows, `data-popup-open` highlight applies while the submenu is open.
- Keyboard: arrow-key navigation, `Esc` to close, focus returns to the trigger.
- Check dark-mode destructive item hover (`data-[variant=destructive]` classes were unchanged from the Radix file, only the highlight selector moved to `data-highlighted`).
