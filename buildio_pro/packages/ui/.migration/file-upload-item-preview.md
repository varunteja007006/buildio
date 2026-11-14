# file-upload-item-preview

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender` with `enabled`. `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-item-preview.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - Early return `if (!itemContext.fileState) return null` → `enabled: Boolean(itemContext.fileState)`; preview content guarded for null `fileState`.
  - `const ItemPreviewPrimitive = asChild ? Slot : "div"` + JSX → `useRender({ render: isChildRender ? children : <div data-slot="file-upload-preview" />, props: {...} })`; default children (`onPreviewRender(file)` + `children`) pass only when not `asChild`.
  - The component's own `render?: (file, fallback) => ReactNode` content prop is unrelated to Base UI's `render` element prop and is untouched.
  - Image URL cache (`context.urlCache`), `getFileIcon` fallback, `aria-labelledby`, classNames, `"use client"`, export unchanged.

## Left alone

- `file-upload-root.tsx` (later phase); `file-upload-utils.tsx`.

## Behavior changes

- Default path identical. Deprecated `asChild`: child's own children preserved; Radix actually threw on this component's multi-children Slot, so the shim is strictly more robust.

## Verify by hand

- apps/web forms-pickers: uploaded images show a 9×9 thumbnail; non-images show the file-type icon SVG sized by `[&>svg]:size-10`.
