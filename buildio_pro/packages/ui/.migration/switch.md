# switch

2026-11-11 — progressive (strangler-fig) hand migration via the transformation engine (no golden-pair fetch; legacy-style wrapper kept with its own classes). Verdict: clean 1:1 migration to `@base-ui/react/switch`, all typechecks green, wrapper API unchanged for consumers.

## Changed

- `packages/ui/src/components/switch.tsx`
  - Import: `import { Switch as SwitchPrimitive } from "radix-ui"` → `import { Switch as SwitchPrimitive } from "@base-ui/react/switch"` (verified against `node_modules/@base-ui/react/switch/index.d.ts`: `Switch.Root` + `Switch.Thumb` parts).
  - Prop type: `React.ComponentProps<typeof SwitchPrimitive.Root>` → `SwitchPrimitive.Root.Props` (Base UI's idiomatic type per the skill's universal patterns).
  - Class-mapping renames on both Root and Thumb: `data-[state=checked]:` → `data-checked:`, `data-[state=unchecked]:` → `data-unchecked:` (Base UI presence attributes; verified `data-checked`/`data-unchecked` in `SwitchRootDataAttributes`/`SwitchThumbDataAttributes` d.ts). All other classNames kept byte-for-byte, including `data-[size=...]` / `group-data-[size=...]/switch` (own attribute, unchanged) and the shadow/ring treatment.
  - Kept `"use client"`, the `size?: "sm" | "default"` prop, `data-slot` attributes, and the `export { Switch }` name identical.
  - `onCheckedChange` is pass-through in this wrapper, so the Base UI signature change (`(checked, eventDetails)`, `reason: 'none'`) is surfaced only to call sites that opt in; none do.
- `apps/cortex-ai/components/cortex-switch.tsx` (line 15)
  - Import repointed (progressively to `switch-base`, then flipped back to `switch` after finalization).
  - FLAGGED call-site classes renamed with the same mapping: `data-[state=checked]:bg-accent data-[state=checked]:shadow-md` → `data-checked:bg-accent data-checked:shadow-md`. This component owns that class string; without the rename the accent-on-checked styling would silently stop applying.
- `apps/web/components/showcase/forms-section.tsx` (line 17)
  - ONLY the switch import line touched (repointed to `switch-base`, then flipped back). Other agents edited sibling import lines in this file concurrently; their lines were left untouched.
- `packages/ui/src/components/switch-base.tsx` — created as the progressive staging file, then deleted after the flip (strangler-fig finalize step).
- Leftover sweep clean: `grep -n "radix-ui\|@radix-ui"` on `switch.tsx`, `cortex-switch.tsx`, `forms-section.tsx` → no matches.
- Verification: `tsc --noEmit` on `packages/ui` shows zero switch-related errors (remaining output is pre-existing `animate-ui/*` failures — off-limits files, not touched); `pnpm --filter=web typecheck` passes; `pnpm --filter=cortex-ai typecheck` passes (an earlier run failed in `documents-view.tsx` via the concurrently migrating `toggle-group-base` import — a sibling agent's in-flight work, since resolved; unrelated to switch).

## Left alone

- `packages/ui/package.json` — `@base-ui/react` was already installed via catalog; per instructions, no dependency/lockfile/`components.json` edits. Radix deps remain for the other nine in-flight component migrations.
- `packages/ui/src/components/animate-ui/**` — pre-existing typecheck errors (TS2590/TS2322/TS7006 around Base UI generics in accordion/dialog/tabs/popover); animate-ui is off-limits per hard rules. Pre-existing, not attributed to this migration.
- `apps/cortex-ai/components/documents/documents-view.tsx` — imports `toggle-group-base` (another agent's migration); its typecheck error observed mid-flight was not touched.
- All other component wrappers (`checkbox.tsx`, `toggle.tsx`, `tooltip.tsx`, …) — owned by parallel sibling migrations, nine of which were in flight during this run.

## Behavior changes

- Rendered element: Radix `Switch.Root` renders a `<button>`; Base UI renders a `<span role="switch">` with a hidden `<input>` for form submission. The wrapper's `disabled:cursor-not-allowed disabled:opacity-50` variants are now dead CSS on the Root element (span isn't a form control) — kept per instruction to preserve exact classNames; FLAGGED, not patched. Nothing in the current consumer set styles `:disabled` via wrapper passes, so no visual delta.
- `onCheckedChange` now receives `(checked, eventDetails)` where `eventDetails.reason` is `'none'` for switch toggles. No consumer uses the second arg.
- Form submission is preserved (hidden `<input>` always rendered by Base UI vs Radix only-in-form); `name`/`value`/`required`/`defaultChecked`/`checked` props are unchanged in shape.
- Keyboard/pointer toggle behavior is equivalent (Space/Enter on the role="switch" span).

## Verify by hand

- `apps/cortex-ai`: toggle a CortexSwitch in the documents data table and in the extraction dialogs — knob slides right and turns primary; with the accent override it should turn accent-colored with a shadow when ON (confirm the `data-checked:` rename still colors it).
- `apps/web` showcase forms section: flip the switch — checked = primary fill, thumb slides fully right with a 2px inset; unchecked = input-gray fill, thumb at left edge.
- Small size: any `size="sm"` usage (search call sites) — 3.5×6 track, 3×3 thumb, still animates.
- Disabled state: `disabled` switch is dimmed (note: styling comes from the Base UI attribute/prop, the dead `disabled:` classes no longer apply — check opacity is acceptable).
- In a form with `name` set: submitting the form still includes `name="on"` when checked, and omits it when unchecked (hidden input parity with Radix).
