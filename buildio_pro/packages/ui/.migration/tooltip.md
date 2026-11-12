# tooltip

2026-11-12 — strategy: transformation engine on the legacy `new-york` wrapper (no base-style counterpart). Wrapper migrated and folded in place by the orchestrator after the original subagent hit a free-usage limit before starting. Verdict: migrated to `@base-ui/react/tooltip` with a Radix-compat `TooltipProvider` (`delayDuration` → `delay`) and an `asChild` compat shim on `TooltipTrigger` (→ `render`), so the 25 `asChild` call sites across 20 consumer files needed no edits.

## Changed

- `packages/ui/src/components/tooltip.tsx` (rewritten in place; exports unchanged: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`)
  - Import: `Tooltip` from consolidated `radix-ui` → `@base-ui/react/tooltip` (verified parts against `node_modules/@base-ui/react/tooltip/**` d.ts: Root/Trigger/Portal/Positioner/Popup/Arrow/Provider).
  - Anatomy: Radix `Portal > Content` → Base UI `Portal > Positioner > Popup` (`sideOffset` moves to Positioner; positioning props like `side` passed by consumers land on Positioner; `className` stays on Popup).
  - Class mapping on Popup: `origin-(--radix-tooltip-content-transform-origin)` → `origin-(--transform-origin)` (verified `CommonPositionerCssVars.transformOrigin`); `data-[state=closed]:` → `data-closed:` (Base UI presence attribute); `data-[side=...]` selectors kept (same attribute name). All other classes byte-identical.
  - `TooltipProvider`: kept consumer-facing `delayDuration` prop, mapped internally to Base UI `delay` (5 consumer files use it, 2 pass `delayDuration={0}`).
  - `TooltipTrigger`: deprecated `asChild` compat shim — when set, forwards the child element to Base UI's `render` prop (identical semantics to Radix `asChild`). Added `data-slot="tooltip-trigger"`.
  - Consumers: 25 `TooltipTrigger asChild` sites across 20 files (poker-planner, scribble, secret-santa, portfolio, cortex-ai, web, packages/ui internals incl. `sidebar-menu`, `open-in-new-tab`, `ai-elements/*`) — untouched thanks to the shim. No call sites pass `delay`/`closeDelay` beyond the Provider default.
- Leftover scan `grep -n "radix-ui|@radix-ui"` on this component's files: clean.

## Left alone

- `packages/ui/src/components/animate-ui/components/{radix,animate}/tooltip.tsx` — animate-ui registry ships its own variants by design.
- `packages/ui/src/components/chart-tooltip.tsx` — built on recharts, not Radix tooltip.

## Behavior changes

- Radix Provider `skipDelayDuration` → Base UI Provider `timeout` (default 400 in Base UI). The wrapper doesn't forward it; no consumer sets it.
- Base UI Provider handles open-instance grouping natively; Radix's Provider grouping behavior maps over. Delay feel may differ slightly (flagged, not tuned).
- Base UI popups unmount after the closing transition; Radix kept `data-state=closed` mounted briefly. The `data-closed:animate-out` classes still apply during Base UI's ending phase.

## Verify by hand

- Hover a copy/share/logout button (poker-planner, scribble, secret-santa): tooltip appears after ~0ms delay with the dark foreground bubble and rotated arrow; disappears on leave.
- Portfolio contact icons + projects and the web showcase "Provider wrapper with a short delay" example: tooltips still open with `side` variants (bottom/top) positioned correctly.
- ai-elements message/prompt-input tooltips and sidebar menu tooltips (`side="right" align="center"`) position on the correct side.
- Type into a prompt-input while a tooltip is open: no stuck tooltips.
