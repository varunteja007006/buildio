# file-upload-trigger

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender`, no early return (no `enabled` needed). `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-trigger.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - `const TriggerPrimitive = asChild ? Slot : "button"` + JSX → `useRender({ render: isChildRender ? children : <button data-slot="file-upload-trigger" />, props: {...} })`.
  - Props order preserved (`type="button"`, `aria-controls`, `data-disabled` before `...triggerProps`, then `disabled`/`onClick` last, so the hidden input click always chains after the user's handler).
  - `"use client"`, classNames (none on the component itself), export unchanged.

## Left alone

- `file-upload-root.tsx` (later phase, owns the hidden input + `context.inputId`).

## Behavior changes

- None for the default path. Deprecated `asChild`: child's own children preserved (Radix Slot parity). Call sites (`apps/web` forms-pickers) use `asChild` with a single `<Button>` child — covered; `pnpm --filter=web typecheck` passes.

## Verify by hand

- apps/web forms-pickers: "Browse files" outline button opens the file picker; disabled root (`disabled` prop on `FileUpload`) disables the trigger with `data-disabled` set.
