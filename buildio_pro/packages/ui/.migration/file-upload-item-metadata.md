# file-upload-item-metadata

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender` with `enabled`. `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-item-metadata.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - Early return `if (!itemContext.fileState) return null` → `enabled: Boolean(itemContext.fileState)`; default name/size/error content computed only when `fileState` exists (avoids dereferencing null while building `props`).
  - `const ItemMetadataPrimitive = asChild ? Slot : "div"` + JSX → `useRender({ render: isChildRender ? children : <div data-slot="file-upload-metadata" />, props: {...} })`; default children pass as `children: children ?? defaultContent` only when not `asChild` (avoids clobbering the render element's children).
  - Props order preserved (`dir` first, then `...metadataProps`, merged `className`). `size="sm"` typography variants unchanged.

## Left alone

- `file-upload-root.tsx` (later phase); `file-upload-utils.tsx` (`formatBytes`).

## Behavior changes

- Default path identical. Deprecated `asChild` without children: Base UI now renders the `div` with default content + merged attrs (Radix rendered a props-less fragment — buggy).

## Verify by hand

- apps/web forms-pickers: uploaded file name truncates, size formats (e.g. "1.2 MB"), error text renders destructive red when a file is rejected.
