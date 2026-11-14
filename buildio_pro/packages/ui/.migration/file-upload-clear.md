# file-upload-clear

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender`, `forceMount` stays (it is local conditional-render logic, not a Radix Presence prop). `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-clear.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` prop marked `@deprecated Radix compat — Base UI uses render.` (button.tsx convention).
  - `const ClearPrimitive = asChild ? Slot : "button"` + JSX → single `useRender({ enabled: shouldRender, render: isChildRender ? children : <button data-slot="file-upload-clear" />, props: {...} })`.
  - Early return `if (!shouldRender) return null` → `enabled: shouldRender` (keeps hook order valid).
  - Props order preserved (`type`, `aria-controls`, `data-disabled` before `...clearProps`, then `disabled`/`onClick` last).
  - `"use client"`, `forceMount` semantics, classNames, export unchanged.

## Left alone

- `file-upload-root.tsx` (family owner, Direction + Slot — later phase), `file-upload-context.tsx`, store/flow files.
- App call sites: none use `FileUploadClear`.

## Behavior changes

- None for the default path. Deprecated `asChild` path: child element's own children are preserved (matches Radix Slot merge); Base UI event-handler/prop merge replaces Radix's.

## Verify by hand

- In a file upload with files selected, the Clear button appears and empties the list; disabled state dims via `data-disabled` when the root is disabled.
