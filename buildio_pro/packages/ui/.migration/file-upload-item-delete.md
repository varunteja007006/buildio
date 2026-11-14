# file-upload-item-delete

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender` with `enabled`. `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-item-delete.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - Early return `if (!itemContext.fileState) return null` → `enabled: Boolean(itemContext.fileState)`.
  - `const ItemDeletePrimitive = asChild ? Slot : "button"` + JSX → `useRender({ render: isChildRender ? children : <button data-slot="file-upload-item-delete" />, props: {...} })`.
  - Props order preserved (`type`, `aria-controls`, `aria-describedby` before `...deleteProps`, `onClick` last). REMOVE_FILE dispatch logic unchanged.

## Left alone

- `file-upload-root.tsx` (later phase); context/store files.

## Behavior changes

- None for the default path. Deprecated `asChild`: child's own children preserved (Radix Slot parity). Call sites (`apps/web` forms-pickers) use `asChild` with a single `<Button>` child — covered; `pnpm --filter=web typecheck` passes.

## Verify by hand

- apps/web forms-pickers: the × ghost button removes the file from the list.
