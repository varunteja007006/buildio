# backdrop-scrollbar-gutter

2026-11-15 · cross-cutting fix: backdrop leaves the scrollbar-gutter strip uncovered on the right when a dialog opens (classic/inset scrollbars) · ✅ fixed in dialog, alert-dialog, sheet

## Symptom

With a `Dialog`/`AlertDialog`/`Sheet` open, a strip on the right edge of the viewport (the classic scrollbar area, ~15–17px) stays undimmed. Screenshot on the components showcase page showed a white scrollbar track next to the dimmed page. Pixel-scan of the screenshot confirmed the backdrop covered everything except the scrollbar strip.

## Root cause

Base UI's `useScrollLock` (`@base-ui/utils/useScrollLock`, used by `Dialog.Root` when `modal`) locks the page by setting `overflowY: hidden` on the scroll container and **`scrollbarGutter: 'stable'` on `<html>`** — unlike Radix, which removes the scrollbar and manually compensates with `padding-right` on `<body>`. The reserved gutter sits outside what `position: fixed; inset: 0` elements paint over.

Upstream: [mui/base-ui#4615](https://github.com/mui/base-ui/issues/4615) — closed as **intentional** ("expected behavior"): avoiding layout shift for `position: fixed` page UI was chosen over covering the scrollbar, because manual scrollbar-width compensation is easy to get wrong (and Radix has that class of bugs). There is no Base UI prop to change it, and no standard CSS (`scrollbar-avoid` is still a CSSWG draft idea).

## Fix

Backdrop class changed from `fixed inset-0` to `fixed inset-y-0 left-0 w-screen` in:

- `dialog.tsx` (`DialogOverlay`)
- `alert-dialog.tsx` (`AlertDialogOverlay`)
- `sheet.tsx` (`SheetOverlay`)

`100vw` includes the classic scrollbar/gutter area (the same spec behavior behind the well-known "100vw causes horizontal overflow" gotcha), so the backdrop now paints over the gutter. Fixed-position elements don't create scrollbars, so no overflow appears, and the backdrop only mounts while the scroll lock is active. With overlay scrollbars (macOS default, mobile) the gutter is 0 and `w-screen` is identical to `inset-0` — zero behavior change. The backdrop is purely visual (pointer events pass through to the dismiss layer), so widening it cannot affect interaction. The popup keeps centering on the content area (`left-1/2`), matching Radix visuals.

## Not applied to

- Menus/popovers/selects/tooltips — they don't lock page scroll (no gutter is reserved).
- `drawer.tsx` — still Radix-based (vaul), which already covers the gutter.

## Verify by hand

- Linux/Windows with classic scrollbars: open the showcase Dialog/AlertDialog/Sheet — the strip at the right edge is now dimmed; the page behind must not shift when the dialog opens/closes.
- macOS-style overlay scrollbars: dialogs look unchanged.
- Closing animations still complete without a backdrop flash (see `animation-exit-flash.md`).
