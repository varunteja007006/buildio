# file-upload-list

2026-11-14 — Radix→Base UI shim migration. Verdict: clean; `Slot` → `useRender` with `enabled`. `forceMount` stays (local conditional-render logic, not Radix Presence). `grep -n radix` clean.

## Changed

- `packages/ui/src/components/file-upload-list.tsx`
  - Import `Slot as SlotPrimitive` from `"radix-ui"` → `useRender` from `"@base-ui/react/use-render"`.
  - `asChild` marked `@deprecated Radix compat` per button.tsx.
  - Early return `if (!shouldRender) return null` → `enabled: shouldRender` (keeps hook order valid).
  - `const ListPrimitive = asChild ? Slot : "div"` + JSX → `useRender({ render: isChildRender ? children : <div data-slot="file-upload-list" />, props: {...} })`.
  - Props order preserved (`role="list"`, `id`, `aria-orientation`, `data-orientation`, `data-state`, `dir`, then `...listProps`, merged `className`).
  - `data-[state=active]`/`data-[state=inactive]` animate-in/out classes and horizontal-orientation class byte-identical; `forceMount` semantics unchanged.

## Left alone

- `file-upload-root.tsx` (later phase, provides `context.listId`).

## Behavior changes

- None: when rendered, `shouldRender` is true so `data-state` is always `"active"` exactly as before.

## Verify by hand

- apps/web forms-pickers: the list fades/slides in from the top when files are added and animates out when emptied; `role="list"` and `aria-orientation` present in DOM.
