# file-upload-item-progress

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender` with `enabled` in each of the three variant branches (hook runs exactly once per render). `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-item-progress.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - Early returns `if (!fileState) return null` / `if (!shouldRender) return null` → `enabled: shouldRender` where `shouldRender = Boolean(fileState) && (forceMount || progress !== 100)`. `progress` guarded (`fileState?.progress ?? 0`) so the variant branches can build `props` safely when disabled.
  - Per-variant JSX (`circular` svg, `fill` clipPath, `linear` inner translateX div) converted to the `useRender` `props` object with identical attribute order (`role`/aria values, then `...progressProps`, merged `className`; `style` still last in `fill`).
  - All three variants' classNames, SVG geometry, transitions, `"use client"`, export unchanged.

## Left alone

- `forceMount` prop: it is local conditional-render logic (no Radix Presence primitive involved), kept byte-identical; no app uses it.

## Behavior changes

- Default path identical. Deprecated `asChild`: child's own children preserved; variant visuals are dropped in that mode (Radix threw on the multi-children Slot anyway).

## Verify by hand

- Simulate upload progress (onUpload with onProgress): linear bar fills left→right with 300ms transition, at 100% the bar unmounts; `forceMount` keeps it mounted at 100%.
