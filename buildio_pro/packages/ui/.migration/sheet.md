# sheet

2026-11-15 · in-place wrapper migration from `radix-ui` to `@base-ui/react/dialog` (render-prop shim for `asChild`) · ✅ migrated, Radix-free

Sheet is a side-anchored dialog built on the Radix `Dialog` primitive (`SheetPrimitive = Dialog`); it migrates identically to `dialog.md` — same `@base-ui/react/dialog` target, `Overlay` → `Backdrop`, `Content` → `Popup`, `data-[state=*]` → `data-open`/`data-closed`.

## Changed

- Import: `radix-ui` → `@base-ui/react/dialog`.
- Anatomy renames as above (export names `SheetOverlay`/`SheetPortal` kept).
- `asChild` shim on `SheetTrigger` and `SheetClose` (deprecated JSDoc-tagged, `isValidElement`-guarded) — `apps/web/components/showcase/overlays-section.tsx:121` uses `SheetTrigger asChild`.

## Left alone

- `side?: "top" | "right" | "bottom" | "left"` (default `"right"`) with all per-side slide classes — wrapper-level prop; the slide classes now use `data-closed:slide-out-to-*` / `data-open:slide-in-from-*`.
- `showCloseButton` (default `true`) and the close button's position as the **direct child of the popup** — `packages/ui/src/components/sidebar.tsx` (mobile sidebar) passes `[&>button]:hidden` and `data-sidebar` attributes that target it, and spreads `style={{ "--sidebar-width": … }}` through to the popup.
- Non-animated class strings byte-for-byte identical.

## Behavior changes

- Follow-up 2026-11-15: the close button's inert `data-[state=open]:bg-secondary` selector was removed (Base UI's `Close` part never received the attribute).
- Follow-up 2026-11-15: `data-closed:fill-mode-forwards` added to Backdrop and Popup to fix the end-of-close backdrop flash — see `animation-exit-flash.md`.
- Base UI popups unmount after the closing transition; exit animations preserved via `data-closed:` during the ending phase.

## Verify by hand

- Radix sweep on `sheet.tsx` → no matches.
- Web showcase sheet example (`overlays-section.tsx`, `SheetTrigger asChild`, `side="right"`): overlay fade, panel slide in/out from the right.
- Sidebar mobile sheet (`sidebar.tsx`): `side={side}`, hidden close button, `--sidebar-width` still applied.
- `animate-ui/components/radix/sidebar.tsx` also consumes Sheet (out of scope, spot-check if touched later).
