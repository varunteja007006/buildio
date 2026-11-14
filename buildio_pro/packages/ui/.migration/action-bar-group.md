# action-bar-group

2026-11-14 — Slot → `useRender` (deprecated `asChild` shim kept). Verdict: clean, typecheck green, roving-focus logic untouched.

## Changed

- `packages/ui/src/components/action-bar-group.tsx`
  - Import: `import { Slot } from "@radix-ui/react-slot"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `const GroupPrimitive = asChild ? Slot : "div"` + JSX rewritten to `useRender({ defaultTagName: "div", render, ref: composedRef, props: {...} })`, wrapped in the same `<FocusContext.Provider>`.
  - `children` destructured; only spread into props when not composing.
  - role/group, `data-orientation`, `dir`, dynamic `tabIndex`, onBlur/onFocus/onMouseDown roving-focus handlers, ENTRY_FOCUS custom event, className — byte-identical logic.

## Left alone

- `action-bar-context.tsx` (`DivProps.asChild`, focus helpers) — context file not in this migration's scope.

## Behavior changes

- None for valid `asChild` usage; useRender composes the child's own handlers with the group's, matching Slot semantics.

## Verify by hand

- Focus enters the toolbar: first item focused on entry; Tab cycles through items per orientation; Shift+Tab moves focus out.
