# accordion

2026-11-12 — strategy: strangler-fig (accordion-base.tsx → repoint consumers → typecheck → finalize in place). Verdict: migrated cleanly to `@base-ui/react/accordion` (Root/Item/Header/Trigger/Panel), single consumer updated, `pnpm --filter=web typecheck` clean.

## Changed

- `packages/ui/src/components/accordion.tsx` (written via transient `accordion-base.tsx`, then finalized in place):
  - Import: consolidated `radix-ui` → `@base-ui/react/accordion`.
  - `AccordionPrimitive.Content` → `AccordionPrimitive.Panel` (Base UI part name; d.ts: `AccordionPanel`).
  - Class-mapping renames (verified against the package d.ts, not guessed):
    - Trigger: `[&[data-state=open]>svg]:rotate-180` → `[&[data-panel-open]>svg]:rotate-180` — Base UI's trigger uses `triggerOpenStateMapping`, which emits `data-panel-open`, NOT `data-open` (see `trigger/AccordionTriggerDataAttributes.d.ts`).
    - Panel: `data-[state=closed]:animate-accordion-up` → `data-closed:...`, `data-[state=open]:animate-accordion-down` → `data-open:...` — the panel inherits the collapsible open-state mapping (`utils/collapsibleOpenStateMapping.mjs`), so `data-closed` is present when closed even though `AccordionPanelDataAttributes.d.ts` only lists `data-open`.
  - Added an inline-style alias on the Panel: `--radix-accordion-content-height: var(--accordion-panel-height, auto)` (cast as `React.CSSProperties`). Reason: tw-animate-css's `accordion-down/up` keyframes resolve through `--radix-accordion-content-height → ... → auto`, and Base UI sets its own `--accordion-panel-height` CSS var (see `panel/AccordionPanelCssVars.d.ts`). Without the alias the keyframes resolve to `height: auto`, which interpolates discretely — content pops instead of animating. All Tailwind classes stay byte-identical; the fix lives entirely in the wrapper since `globals.css` is off-limits.
- `apps/web/components/showcase/navigation-section.tsx` (the only consumer in the workspace):
  - `<Accordion type="single" collapsible ...>` → `<Accordion ...>` — Base UI has no `type` prop (single mode is the default; `multiple` opts into multi-open) and no `collapsible` prop (single accordions are always collapsible).
  - Transient repoint to `accordion-base`, flipped back to `@workspace/ui/components/accordion` after finalize.
- `pnpm --filter=web typecheck` clean before and after finalization. `packages/ui` has no typecheck script; it is covered transitively by the web app's `tsc`.

## Left alone

- `animate-ui/*` accordion variants — registry-owned.
- `packages/ui/package.json`, `pnpm-lock.yaml`, `packages/ui/src/styles/globals.css`, `components.json` — off-limits (note: `package.json`/`globals.css` show as modified by sibling agents' work).
- Untracked files (`code-block.tsx`, `trace.tsx`, `use-highlighted-code.ts`, `highlighter.tsx`) — none of them import accordion.
- No `asChild` usage exists on any accordion call site, so no compat shim was needed (unlike tooltip). No `forceMount` usage either (`keepMounted` is Base UI's equivalent and exists on both Root and Panel).

## Behavior changes

- Radix `type="single"`/`type="multiple"` API is gone: single-open is Base UI's default, multi-open uses `multiple`. Also, Base UI's `value` is ALWAYS an array (`AccordionValue<Value> = Value[]`), even in single mode — programmatic control must pass arrays (e.g. `value={["a"]}`), while `AccordionItem value` stays a scalar. No call sites in this repo control the value, so nothing to migrate.
- Data attributes change as above; the workspace targets none of them in custom CSS.
- `onValueChange` signature differs: Base UI passes `(value: T[], eventDetails)` and always an array; Radix single mode passed a scalar. Also has no `eventDetails.reason` for keyboard nav the same way (REASONS.triggerPress | none).
- Height animation is preserved via the CSS-var alias in the wrapper; without consumer-side overrides this behaves like Radix (0.2s ease-out height animation, `animationName: 'none'` on initially-open panels is handled by Base UI itself).
- `orientation`/`loopFocus` are deprecated no-ops in Base UI (roving focus removed per APG guidance); keyboard behavior on the trigger list may differ slightly from Radix.
- Default unmount-on-close is kept (no `keepMounted` anywhere).

## Verify by hand

- `apps/web` showcase → Navigation → Accordion: click each FAQ row — smooth height animation on open AND close, chevron rotates when open, content readable.
- Confirm initially-open panels (not exercised in the repo) don't flash the animation on mount.
- Note sibling migrations (tabs, scroll-area, popover, etc.) are in flight; errors in unrelated files during typecheck are theirs.
