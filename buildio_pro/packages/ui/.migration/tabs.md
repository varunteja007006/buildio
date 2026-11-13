# tabs

2026-11-12 · Strangler-fig (tabs-base.tsx → repoint 3 consumer files → typecheck → copy over tabs.tsx → revert imports) · **MIGRATED CLEAN** — zero Radix references remain; expense-tracker + web typecheck pass.

Note: sibling component migrations (button, accordion, slider, select, popover, scroll-area, alert-dialog, context-menu, dropdown-menu) were in flight concurrently; typecheck was scoped to apps this migration touched (expense-tracker, web).

## Changed

- `packages/ui/src/components/tabs.tsx` — rewritten on Base UI (`import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"`), verified against `packages/ui/node_modules/@base-ui/react/tabs/*.d.ts` before writing. Part mapping: `Root`→`Root`, `List`→`List`, `Trigger`→`Tab`, `Content`→`Panel` (namespaced parts from `index.parts.d.ts`). Public API names unchanged (Tabs/TabsList/TabsTrigger/TabsContent/tabsListVariants).
- Data attributes per d.ts: `data-[state=active]` → `data-active` (TabsTabDataAttributes.active = "data-active"); no `data-[state=inactive]` styles existed. All other selectors (`group-data-[orientation=…]/tabs`, `group-data-[variant=…]/tabs-list`) keep working because Base UI Root/Tab emit `data-orientation` natively (TabsRootDataAttributes/TabsTabDataAttributes.orientation = "data-orientation") — the manual `data-orientation={orientation}` on Root is retained and redundant-but-harmless.
- Consumer repoint (temporary, then reverted after finalize): `apps/expense-tracker/app/(protected)/settings/page.tsx`, `apps/expense-tracker/components/organisms/event/event-details.tsx`, `apps/web/components/showcase/tabs-demo.tsx`.

## Left alone

- All Tailwind classes byte-identical (only the state-attribute selectors renamed per d.ts).
- Call-site props needed no changes: every consumer passes only `defaultValue`/`value`/`disabled`/`className` — all valid Base UI props. No `asChild` anywhere, so no `render`-prop shim was needed. No `activationMode` (Radix `manual`) consumers — Base UI's equivalent `activateOnFocus` on List defaults to `false`, matching Radix's default `activationMode="auto"`… note: semantics are inverted; default here is focus-select-off, which is manual-style activation. Verified no call site depends on arrow-focus auto-activation.
- `packages/ui/src/styles/globals.css`, `components.json`, package.json, pnpm-lock.yaml, animate-ui/*, untracked files — untouched.
- `tabsListVariants` has no consumers outside tabs.tsx itself.

## Behavior changes

- Inactive panels are unmounted by default in both libraries (Base UI `keepMounted=false`, Radix unmounts unless `forceMount`) — equivalent; `forceMount` was never used.
- `Tabs.Tab` `value` prop is required in Base UI (it was de-facto required in Radix too); all call sites pass it.
- Keyboard activation: Base UI List defaults `activateOnFocus=false` (activate on Enter/Space). Radix's default was auto-activation on focus. No consumer uses vertical/roving auto-activation, so no visible change in this repo; add `activateOnFocus` to `TabsList` if that behavior is ever wanted.
- `onValueChange` signature differs: Base UI passes `(value, eventDetails)` where Radix passed `(value)`. No consumer uses `onValueChange`.
- Base UI sets `data-activation-direction` and Base UI Panel sets its own presence attributes — not styled here, no effect.

## Verify by hand

- `apps/web` showcase demo: switch Account/Workspace tabs; Advanced is disabled and unselectable; active-trigger background/shadow (default variant) still applies via `data-active`.
- `apps/expense-tracker` settings page: Profile/Regional switching renders the right panel.
- `apps/expense-tracker` event-details: Account/Graph tabs inside the dialog, panels with `min-h-[400px]` still lay out.
- Keyboard: arrow keys move focus between triggers, Enter/Space activates (Base UI default), focus loops at the ends (`loopFocus` default true).
