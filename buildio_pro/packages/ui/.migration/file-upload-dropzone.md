# file-upload-dropzone

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender`, no early return to guard (no `enabled` needed). `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-dropzone.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - `const DropzonePrimitive = asChild ? Slot : "div"` + JSX → single `useRender({ render: isChildRender ? children : <div data-slot="file-upload-dropzone" />, props: {...} })`.
  - Props order preserved: `role`/`id`/aria/data attributes, `dir`, `tabIndex`, then `...dropzoneProps`, merged `className`, event handlers last (user handlers chain via Base UI merge as before).
  - All drag/paste/keyboard/click handlers, classNames, `data-dragging`/`data-invalid`/`data-disabled` attrs, `"use client"`, export unchanged.

## Left alone

- `file-upload-root.tsx` (Direction + Slot — later phase); context/store/flow files.

## Behavior changes

- None for the default path. Deprecated `asChild`: child's own children preserved (Radix Slot parity).

## Verify by hand

- apps/web showcase forms-pickers: drag a file over the dropzone (border turns primary/30), drop to add, click anywhere outside the trigger opens the file picker, Enter/Space on the focused dropzone opens the picker.
