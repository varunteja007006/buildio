# button-group

2026-11-14 — Slot → `useRender` composition on `ButtonGroupText` only. Verdict: clean 1:1, all typechecks green, wrapper API unchanged.

## Changed

- `packages/ui/src/components/button-group.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`, plus added `import * as React from "react"` (new value usage `React.isValidElement`; original relied on the UMD global type-only).
  - `ButtonGroupText`: `const Comp = asChild ? Slot.Root : "div"` → `useRender({ render: isSlot ? children : <div />, props: {...} })` with `isSlot = asChild && React.isValidElement(children)`.
  - `children` destructured; passed in `props` only when not composing.
  - `asChild` marked `/** @deprecated Radix compat — Base UI uses `render`. */`.
  - NOTE: original had NO `data-slot` attribute on `ButtonGroupText` — deliberately not added (byte-identical DOM). `ButtonGroup` and `ButtonGroupSeparator` untouched.

## Left alone

- `package.json` / catalog — no dependency edits.
- Only app call site is `apps/web/components/showcase/navigation-section.tsx` (`ButtonGroupText` without `asChild`) — untouched.

## Behavior changes

- None for existing call sites.

## Verify by hand

- `apps/web` showcase buttons section: grouped buttons still render with joined corners (`rounded-l-none`/`border-l-0` on non-first children) and the text label block between them.
