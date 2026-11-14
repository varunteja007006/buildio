# file-upload-item

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender` with `enabled`, wrapped by `FileUploadItemContext.Provider` as before. `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-item.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - Early return `if (!fileState) return null` → `enabled: Boolean(fileState)` (useRender is a hook; must run unconditionally). `statusText`/`aria-describedby` guarded for the `fileState == null` case.
  - `const ItemPrimitive = asChild ? Slot : "div"` + JSX → `useRender({ render: isChildRender ? children : <div data-slot="file-upload-item" />, props: {...} })`; result still wrapped in the item context Provider.
  - Default children keep the exact original composition: `{children}` + the sr-only status `<span id={statusId}>`.
  - `role="listitem"`, `aria-setsize`/`aria-posinset`/`aria-describedby`/`aria-labelledby`, `dir`, classNames, `"use client"`, export unchanged.

## Left alone

- `file-upload-root.tsx` (later phase); `file-upload-item.tsx` (the unrelated Item registry component, already on Base UI) untouched.

## Behavior changes

- Deprecated `asChild` path no longer injects the sr-only status span into the child (Radix actually threw `Slot failed to slot onto its children` for this component's multi-children Slot — the shim is strictly more robust).

## Verify by hand

- apps/web forms-pickers: upload files → each item lists with preview, name/size metadata, delete button; sr-only status text present in DOM.
