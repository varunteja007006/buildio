# toggle

2026-11-11 — strategy: transformation engine (project style is legacy `new-york`, which has no `base-<style>` counterpart, so the radix golden was used only to confirm the shape; wrapper transformed by hand, classes preserved verbatim). Verdict: migrated cleanly to `@base-ui/react/toggle` (callable single-part primitive), original import path `@workspace/ui/components/toggle` kept valid via finalize-in-place; consumers needed no API changes because Radix and Base UI prop names coincide here. Parallel sibling migrations (checkbox, switch, toggle-group, tooltip, avatar, separator, progress, collapsible, radio-group) were in flight during this run.

## Changed

- `packages/ui/src/components/toggle-base.tsx` → `packages/ui/src/components/toggle.tsx` (strangler-fig: base version written beside the original, consumers repointed, then finalized in place):
  - `import { Toggle as TogglePrimitive } from "radix-ui"` → `import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"` (verified against `node_modules/@base-ui/react/toggle/Toggle.d.ts`).
  - `TogglePrimitive.Root` → callable `TogglePrimitive` (single-part primitive, per skill part-rename table and the base-registry golden wrapper).
  - Wrapper prop type `React.ComponentProps<typeof TogglePrimitive.Root>` → `TogglePrimitive.Props` (golden idiom; includes ref via `BaseUIComponentProps<'button', ToggleState>`).
  - Class-mapping rewrites in `toggleVariants`: `data-[state=on]:bg-accent` → `data-pressed:bg-accent`, `data-[state=on]:text-accent-foreground` → `data-pressed:text-accent-foreground`. No `data-[state=off]` selectors existed. `data-pressed` verified as the real attribute in `@base-ui/react/toggle/ToggleDataAttributes.d.ts` (`data-pressed`, `data-disabled`). `disabled:*` variants kept — Base UI Toggle still renders a `<button>`, so they are not dead code.
  - All other new-york classes preserved verbatim; `data-slot="toggle"` kept; exports `Toggle`, `toggleVariants` unchanged. File is 45 lines (<250 limit).
- `apps/expense-tracker/components/pages/transactions/transactions-filter-toolbar.tsx:96` — Toggle call-site class string rewritten from `data-[state=on]:*` to `data-pressed:*` (amber highlight classes on the "Needs review" toggle). `pressed` / `onPressedChange` call-site props were already valid names for Base UI (Radix `pressed`/`onPressedChange` coincide with Base UI `pressed`/`onPressedChange`; Base UI's callback additionally receives `(pressed, eventDetails)` — the 1-arg handler typechecks unchanged).
- `apps/expense-tracker/components/pages/transactions/transactions-filter-toolbar.tsx:3` — import repointed to `toggle-base` for the transition, then flipped back to `@workspace/ui/components/toggle` at finalize.
- `apps/web/components/showcase/navigation-section.tsx:37` — same import repoint/flip; call site is uncontrolled `<Toggle aria-label>` with no state props, no further change needed.
- Leftover sweep clean: `grep -n "radix-ui|@radix-ui"` on `packages/ui/src/components/toggle.tsx`, both consumer files → zero matches.
- Typechecks: `packages/ui` `tsc --noEmit` has zero errors in toggle/toggle-base/toggle-group files (pre-existing failures in `animate-ui/*` and `files.tsx` exist at baseline and are not attributable to this migration — some are Base-UI-typing errors in animate-ui files owned by other work); `pnpm --filter=expense-tracker typecheck` ✅; `pnpm --filter=web typecheck` ✅. `packages/ui` has no `typecheck` script (only `lint`), so tsc was run directly with its tsconfig.

## Left alone

- `packages/ui/src/components/toggle-group.tsx` — imports `toggleVariants` from `@workspace/ui/components/toggle`; owned by a sibling agent. Untouched entirely; because the finalize kept the original path, it now receives base-variant classes automatically with zero edits.
- `ToggleGroupItem` call sites in `transactions-filter-toolbar.tsx` (lines 75–88, `data-[state=on]:text-red-600` etc.) — toggle-group consumer surface, owned by the toggle-group sibling agent; only the `Toggle` import line and `Toggle` JSX were edited there.
- `apps/cortex-ai/components/documents/documents-view.tsx` — imports only toggle-group, not toggle; sibling agent's surface.
- `cmdk`, `vaul`, `sonner`, `input-otp`, `react-day-picker`, `recharts`, `embla`, `animate-ui/*` — not radix (or out of scope); intentionally untouched.
- `packages/ui/components.json` — style stays `new-york` per instructions (no components.json/dep changes in this run; flagged for a whole-project run: future `shadcn add` will still deliver radix variants until the style flips).
- No package.json, lockfile, or install changes — `@base-ui/react@1.9.0` was already present in `packages/ui`.

## Behavior changes

- None observed at the wrapper level. Base UI Toggle keeps `pressed`/`defaultPressed`/`onPressedChange` names; both consumer call sites typecheck unchanged.
- Minor flagged delta (invisible here, worth knowing): Base UI's `onPressedChange` fires with `(pressed, eventDetails)` where `eventDetails.reason` distinguishes pointer/keyboard/etc. Existing 1-arg handlers still work; no consumer needed a signature change.
- Radix emits `data-state="on|off"`; Base UI emits `data-pressed` (no off attribute). Any consumer CSS targeting `data-[state=on]` on a toggle silently loses the hook — one such consumer class string was rewritten (see Changed). An app-wide sweep of other `data-[state=on]` usage is part of sibling agents' surfaces.

## Verify by hand

- In `apps/web` showcase (Navigation section → "Toggle & ToggleGroup"): click the bold toggle — background/text turn accent (`data-pressed:` styling works), click again to unpress.
- Keyboard: Tab to the toggle, press Space/Enter — pressed state toggles and matches click styling.
- In `apps/expense-tracker` transactions toolbar: "Needs review" outline toggle shows the amber border/bg/text when active, including in dark mode (`dark:data-pressed:text-amber-400`).
- Disabled/invalid styling: not exercised by any current consumer, but `disabled:*` and `aria-invalid:*` classes are unchanged and the element is still a native button.
