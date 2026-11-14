# breadcrumb

2026-11-14 — Slot → `useRender` composition on `BreadcrumbLink` only (the sole Slot user). Verdict: clean 1:1, all typechecks green, wrapper API unchanged.

## Changed

- `packages/ui/src/components/breadcrumb.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `BreadcrumbLink`: `const Comp = asChild ? Slot.Root : "a"` → `useRender({ render: isSlot ? children : <a data-slot="breadcrumb-link" />, props: {...} })` with `isSlot = asChild && React.isValidElement(children)`.
  - `children` destructured; passed in `props` only when not composing (avoids clobbering the render element's children).
  - `asChild` marked `/** @deprecated Radix compat — Base UI uses `render`. */`.
  - `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` untouched (no Slot); classNames/data-slot/exports byte-identical.

## Left alone

- `apps/book` call sites (`app/home/page.tsx`, `app/home/notes/page.tsx`, `components/books/book-detail.tsx`) use `<BreadcrumbLink asChild><a href=...>` — covered by the shim, no edits needed.

## Behavior changes

- None. Composed child keeps its own children; `className` from the wrapper joins with the child's, matching Slot semantics.

## Verify by hand

- `apps/book` home/notes/book-detail breadcrumbs: links render as plain `<a>` with hover color transition; current page still non-link (`BreadcrumbPage`).
