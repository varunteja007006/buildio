# button

2026-11-14 · strategy: in-place wrapper rewrite from Radix `Slot` to `@base-ui/react/button`, with a deprecated `asChild` compat shim translating to Base UI's `render` prop · verdict: **COMPLETE** — 9/9 consuming apps typecheck (one pre-existing sibling-migration error in `apps/book/components/topic-switcher.tsx` is unrelated and out of scope).

> NOTE: this migration was started by a previous agent and interrupted by a usage limit; the wrapper rewrite and the `action-bar-item.tsx` event-typing fix were already in place, and this session verified, swept, and finished the report. Sibling migrations (select, alert-dialog, dropdown-menu) were running in parallel in other files during this work — their errors were not touched.

## Changed

- `packages/ui/src/components/button.tsx` — already rewritten by the previous agent to use `ButtonPrimitive` from `@base-ui/react/button`; verified against the d.ts (no Slot in Base UI, `render` accepts a `ReactElement`, `nativeButton` lives in `NativeButtonProps`). The `asChild` compat shim is present and correct:
  - `asChild` is kept in the props type but marked `@deprecated Radix compat — Base UI uses render`.
  - `asChild && React.isValidElement(children)` → `<ButtonPrimitive {...buttonProps} render={children} nativeButton={isNativeButtonChild ? undefined : false} />`, where `isNativeButtonChild` checks whether the child is a literal `"button"` element. `nativeButton={false}` lets Base UI enforce button semantics when the render element is a non-button (e.g. Next.js `<Link>` / `<a>`).
  - Same shape as the `TooltipTrigger` shim in `packages/ui/src/components/tooltip.tsx`, extended with the `nativeButton` decision.
  - All Tailwind classes in `buttonVariants` are **byte-identical** to the Radix original (`diff` of `git show HEAD:./packages/ui/src/components/button.tsx` lines 7–39 vs current: empty).
- `packages/ui/src/components/action-bar-item.tsx` — previous agent's event-typing fix verified: derives `ButtonProps` from `React.ComponentProps<typeof Button>` and extracts `ButtonEvent<K>` via `Parameters<Extract<NonNullable<ButtonProps[K]>, (event: never) => void>>[0]`, replacing `React.MouseEvent<ItemElement>` / `FocusEvent` / `KeyboardEvent` on `onClick`, `onFocus`, `onKeyDown`, `onMouseDown`. Compiles cleanly in every consuming app's typecheck.

## Left alone

- Every consumer file. The shim covers all direct `<Button asChild>` call sites found by grep (scribble `app/page.tsx`, cortex-ai `chat-thread.tsx` / `agent-detail.tsx` / `agent-playground.tsx`, billezy `app/layout.tsx` / `group-view.tsx`, book `app/page.tsx`, secret-santa `app/page.tsx` — all rendering `<Link>` or `<a>` children), so no call-site edits were needed.
- All sibling in-flight migrations (dropdown-menu, select, alert-dialog, accordion, tabs, slider, scroll-area, popover, context-menu) and their modified files, including the `book` `topic-switcher.tsx` error above.
- Untouched by rule: `package.json`, `pnpm-lock.yaml`, `globals.css`, `components.json`, untracked files (`code-block.tsx`, `trace.tsx`, `use-highlighted-code.ts`, `highlighter.tsx`), `animate-ui/*`.

## Behavior changes

- `disabled` + clicks: with a native `<button>` render element, Base UI defers to native disabled behavior — same as before. When `asChild` renders a non-button element (`nativeButton={false}`), Base UI enforces disabled/focus behavior itself (`focusableWhenDisabled`, default false) instead of relying on the element; keyboard activation for non-native-button children now runs through Base UI's handlers.
- Radix `Slot.Root` merged props automatically; Base UI `render` merges `className`/style/refs but passes explicit props through — behaviorally equivalent for these consumers since `buttonProps` is spread once.
- Event handler param types changed from DOM-specific (`React.MouseEvent<HTMLButtonElement>`) to whatever Base UI's `BaseUIComponentProps<'button'>` declares; the `action-bar-item.tsx` derivation absorbs this, and no other consumer relied on the narrower type.

## Verify by hand

- `apps/scribble/app/page.tsx` and `apps/secret-santa/app/page.tsx` — `<Button asChild><Link>` renders a working link styled as the default button variant (no nested `<button>` in the DOM, `data-slot="button"` present on the link).
- `apps/billezy/app/layout.tsx` — the `ghost` + `sm` `<Link>` header button and the `outline` + `sm` external `<a>` still open/hover correctly; the `<a target="_blank">` child still opens a new tab.
- `apps/cortex-ai/components/agents/agent-playground.tsx` — `<Button asChild variant="ghost" size="sm">` keeps the ghost/small classes on the link.
- Any action bar (e.g. expense-tracker tables) — clicks on a disabled action-bar item no longer trigger the handler, and keyboard focus/Enter still works.

## Follow-up (2026-11-14)

- `nativeButton` heuristic fixed: previously forced `false` for ANY non-`"button"` child, including function components that render a native `<button>` (e.g. `ComboboxTrigger` via `InputGroupButton`) — Base UI then logged the "expected a non-<button>" console warning. Now `false` is only forced for native non-button *string* elements; function components get Base UI's default (`true`, runtime-validated against the rendered DOM), and an explicitly passed `nativeButton` prop always wins.
