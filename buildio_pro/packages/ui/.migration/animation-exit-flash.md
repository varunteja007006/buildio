# animation-exit-flash

2026-11-15 · cross-cutting fix: backdrop/content flash at the end of the closing animation on every Base-UI-migrated animated popup · ✅ fixed in 9 components

## Symptom

Closing a `Dialog`, `AlertDialog`, or `Sheet` made the backdrop flash (a one-frame return to full opacity) before unmount. Same latent issue in every migrated popup component.

## Root cause

`tw-animate-css@1.4.0`'s `animate-out` utility resolves `animation-fill-mode` to **`none`** by default (`var(--tw-animation-fill-mode, none)` in its `--animate-out` definition), and its `exit` keyframes only define a `to` frame. Sequence on close:

1. Element gets `data-closed` → `data-closed:animate-out data-closed:fade-out-0` plays opacity 1→0.
2. `animationend` fires; Base UI ends the closing phase and unmounts the element.
3. Between `animationend` and the DOM removal paint, `fill-mode: none` makes the element snap back to its natural styles (opacity 1) → visible flash.

`animate-in`/`data-open` is unaffected: the `enter` keyframes define a `from` frame and animate to the natural (final) state.

## Fix

Insert `data-closed:fill-mode-forwards` immediately after `data-closed:animate-out` in every exit-animated class string (`fill-mode-*` is a `tw-animate-css` utility that sets both `animation-fill-mode` and `--tw-animation-fill-mode`). Scoped to `data-closed:` so the enter path is untouched.

Files patched (14 animated parts):

- `dialog.tsx` (Backdrop, Popup)
- `alert-dialog.tsx` (Backdrop, Popup)
- `sheet.tsx` (Backdrop, Popup)
- `dropdown-menu.tsx` (2 parts)
- `context-menu.tsx` (2 parts)
- `popover.tsx`, `select.tsx`, `tooltip.tsx`, `combobox-content.tsx` (1 each)

## Alternative considered

Base UI's handbook recommends CSS **transitions** (`data-starting-style`/`data-ending-style`) over animations (smoothly cancellable mid-flight). Rejected for now: it would mean rewriting every animated class string in all migrated wrappers; `fill-mode-forwards` is a one-token change with identical rendered output.
