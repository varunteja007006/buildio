# checkbox

2026-11-12 — strategy: transformation engine on the legacy `new-york` wrapper (no base-style counterpart), base version written by a parallel agent mid-run, verified against `node_modules/@base-ui/react/checkbox` d.ts and finalized in place by the orchestrator after that agent hit the free-usage limit. Verdict: clean 1:1 migration; consumer import paths unchanged throughout.

## Changed

- `packages/ui/src/components/checkbox.tsx` (finalized from the transient `checkbox-base.tsx`)
  - Import: `import { Checkbox as CheckboxPrimitive } from "radix-ui"` → `import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"`.
  - Class mapping on Root: `data-[state=checked]:` → `data-checked:` (3 selectors); `disabled:cursor-not-allowed disabled:opacity-50` → `data-disabled:...` (verified `data-checked` and `data-disabled` presence attributes in `CheckboxRootDataAttributes.d.ts`). All other classes kept byte-for-byte.
  - Exports, `data-slot`s, `"use client"` unchanged. Consumers keep importing `@workspace/ui/components/checkbox`.
- Consumers (17 files: billezy, cortex-ai ×7, expense-tracker ×6, web ×2, packages/ui FormCheckbox): import paths never changed; no call-site edits required. `onCheckedChange` signature becomes `(checked: boolean, eventDetails)` — every call site uses `Boolean(checked)` / `!!value` / `() => toggle(...)` which are signature-agnostic.

## Left alone

- `packages/ui/src/components/animate-ui/primitives/radix/checkbox.tsx` (animate-ui ships its own base twin by design).
- All other radix wrappers (out of this component's scope).

## Behavior changes

- Radix `onCheckedChange` delivered `boolean | 'indeterminate'`; Base UI delivers plain `boolean` with a separate `indeterminate` prop. `Boolean('indeterminate')` used to be `true` in table select-all logic — with Base UI an indeterminate checkbox now reports `false`. No current call site relies on that truthiness (row-select headers use `!!value` on a boolean), but any future `Boolean(checked)`-as-indeterminate pattern would behave differently.
- `data-[state=indeterminate]` styling is not used by this wrapper; Base UI exposes `data-indeterminate` if needed later.

## Verify by hand

- Click toggles; Space/Enter keyboard toggle; check/uncheck in a table select-all (expense-tracker transactions).
- Indeterminate header checkbox in a data table shows the dash and clicking it selects all rows.
- Disabled checkbox is dimmed and non-interactive; form submit still includes the checkbox value.
