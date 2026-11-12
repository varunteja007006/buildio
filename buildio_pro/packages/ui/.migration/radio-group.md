# radio-group

2026-11-11 · strategy: transformation engine (project style is legacy `new-york`, which has no base-<style> counterpart; wrapper diffed as pristine vs its stock origin) · verdict: migrated cleanly to `@base-ui/react` (`RadioGroup` + `Radio.Root`/`Radio.Indicator`), consumers repointed and finalized back to `radio-group.tsx`; typecheck green at every step.

## Changed

- `packages/ui/src/components/radio-group.tsx` — rewire from consolidated `radix-ui` to `@base-ui/react`:
  - `import { RadioGroup as RadioGroupPrimitive } from "radix-ui"` → `import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"` (group part renders `<div>`; value/defaultValue widened to `Value`, `onValueChange` gains `eventDetails` — all verified against `node_modules/@base-ui/react/radio-group/RadioGroup.d.ts`).
  - `RadioGroupPrimitive.Item` → `Radio.Root` from `@base-ui/react/radio` (renders `<span>` + hidden `<input>`; verified `RadioRoot.d.ts`).
  - `RadioGroupPrimitive.Indicator` → `Radio.Indicator` from `@base-ui/react/radio` (unmounts when unchecked by default, matching Radix; `keepMounted` available).
  - Export names kept IDENTICAL: `RadioGroup`, `RadioGroupItem` (no `RadioGroupItem` part exists in Base UI — the wrapper shims it over `Radio.Root`, per the task's API shape).
  - Class mapping: `disabled:cursor-not-allowed disabled:opacity-50` → `data-disabled:cursor-not-allowed data-disabled:opacity-50`. Base UI `Radio.Root` renders a `<span>`, so `disabled:` Tailwind variants are dead code (no `disabled` attribute on the element; state surfaces as `data-disabled`, confirmed in `RadioRoot.js`). No `data-[state=checked]`/`data-[state=disabled]` tokens existed in this wrapper's class list, so no other renames were needed.
  - All other classNames, `data-slot` attributes, the `CircleIcon` indicator, and `"use client"` preserved verbatim. File is 49 lines (limit 250 OK).
- `apps/web/components/showcase/forms-section.tsx:15` — repointed the radio-group import to `@workspace/ui/components/radio-group-base` for the strangler-fig phase, then flipped back to `@workspace/ui/components/radio-group` after finalization. No call-site props needed changes: usage is `defaultValue` (same name, string compatible with widened `Value`), `className`, and `RadioGroupItem value` (same name). Other agents' import lines in this file were not touched.
- 2026-11-12 visual fix (post-migration, after the checked dot rendered as a dark blob overhanging the circle in the web showcase): Base UI `Radio.Root` renders an inline `<span>`, so the Indicator span (sized to its zero-content absolute child) anchored at the wrong corner. `RadioGroupItem` root now gets `relative inline-flex … items-center justify-center` so it is a real positioned box, the Indicator becomes `absolute inset-0 flex items-center justify-center`, and the `CircleIcon` drops its absolute/translate classes in favor of plain `size-2 fill-primary` inside the flex center. Same visual target as the Radix original.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" packages/ui/src/components/radio-group.tsx` returns nothing.

Typecheck: `packages/ui` exposes no `typecheck` script (only `lint`/`clean`), so verification ran through `pnpm --filter=web typecheck`, which compiles the wrapper as part of web's program. Baseline (pre-migration) was clean; post-`-base` phase clean; post-finalization clean.

Note: nine parallel sibling migrations (checkbox, switch, toggle, toggle-group, tooltip, avatar, separator, progress, collapsible) were in flight; no interlock issues were hit and none of their files were edited.

## Left alone

- `packages/ui/components.json` — still `"style": "new-york"`; per skill rules for legacy styles, no style flip and no registry replay (restyle would change the app's look). Flag: future `shadcn add` in this project will still deliver radix variants until the last radix wrapper is migrated and the style is switched.
- Files importing `RadioGroupPrimitive`/`RadioGroup.Item` directly from `"radix-ui"` inside `packages/ui` (e.g. form components composing radio primitives inline) — not consumers of this wrapper; out of scope for this run, they must be swept when their own wrappers/components migrate.
- cmdk, vaul, sonner, input-otp, react-day-picker, embla, animate-ui/*, recharts — non-radix, never touched.

## Behavior changes

- `orientation` / `loop` (Radix RadioGroup.Root props) are dropped in Base UI: arrow-key navigation handles both axes automatically and focus wrapping is built in. The wrapper spreads `...props`, so any consumer passing these would now get them applied as DOM attributes instead of behavior — none in the current consumer set; flagged per skill policy.
- Callback signature: `onValueChange` now fires as `(value, eventDetails)`. Existing single-arg handlers stay type-safe (arity-safe widening); no consumer passes one at all today.
- Element change: `RadioGroupItem` now renders a `<span>` (with a hidden `<input>`) instead of a `<button>`. Styling preserved via the same class list; `disabled:` variants were swapped to `data-disabled:` because the element is no longer a form control.
- Radix's Item was the focusable element; Base UI moves native focus to the hidden input inside the span. Visual focus-visible ring behavior should be equivalent, but the focus target element differs (see Verify by hand).

## Verify by hand

- `apps/web` showcase → Forms → RadioGroup example: click each option; the filled `CircleIcon` dot appears in the selected item only.
- Keyboard: Tab moves focus into the group (first checked/unchecked item), arrow keys (Up/Down/Left/Right, both axes) move selection across the three items with wrap-around; Space re-selects the focused item.
- Wrap a RadioGroupItem in a `<label>` (as `forms-section.tsx` does) and click the label text — the hidden input inside the span should still activate the radio.
- Disable state: pass `disabled` to a group/item and confirm `data-disabled` styling (opacity-50, cursor-not-allowed) shows on the span, since the `disabled:` variants no longer apply.
