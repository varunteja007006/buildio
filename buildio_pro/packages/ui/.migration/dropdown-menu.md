# dropdown-menu

2026-11-14 · Radix UI `DropdownMenu` → Base UI `@base-ui/react/menu` (parts namespace) · **Verdict: COMPLETE — all 9 repointed apps typecheck clean, Radix sweep clean.** The migration was interrupted by a usage limit mid-flight (the `-base` staging file and consumer repointing survived the interruption); finished by the follow-up agent. Note sibling migrations (button/select/alert-dialog and others) were running concurrently in the same tree — their in-flight changes were left untouched and some unrelated typecheck noise was ignored per plan.

## Changed

- `packages/ui/src/components/dropdown-menu.tsx` — finalized. The migrated implementation (previously staged at `dropdown-menu-base.tsx`, now deleted) replaced the Radix implementation:
  - Import: `radix-ui` → `Menu as DropdownMenuPrimitive` from `@base-ui/react/menu`.
  - `Content`/`SubContent` are now `Portal > Positioner > Popup` composites; positioner props (`align`, `side`, `sideOffset`, `alignOffset`, `collisionPadding`) are forwarded through `Content`.
  - CSS vars: `--radix-dropdown-menu-content-available-height` → `--available-height`; `--radix-dropdown-menu-content-transform-origin` → `--transform-origin`.
  - Data attributes (verified against `node_modules/@base-ui/react/menu/*.d.ts`): `data-[state=open]` → `data-open`, `data-[state=closed]` → `data-closed`, `focus:` → `data-highlighted:`, `data-[disabled]` → `data-disabled`, `data-[state=open]` on SubTrigger → `data-popup-open`. `data-[side=*]` kept (same names in both libs).
  - `DropdownMenuTrigger` gained the deprecated `asChild` compat shim (`render={children}`), same pattern as `TooltipTrigger` in `tooltip.tsx`.
  - `DropdownMenuItem` gained deprecated `onSelect`/`asChild` compat shims; `onSelect` is called before `onClick` from a shared click handler. Base UI's own `closeOnClick` prop passes through for consumers that need to keep the menu open.
  - `DropdownMenuLabel` renders Base UI `GroupLabel` inside a group (via a `DropdownMenuGroupScope` context flag — `GroupLabel` requires a group ancestor to wire `aria-labelledby`) and falls back to a plain `div` for standalone labels (Radix `Label` worked standalone).
  - All 15 export names identical to the Radix version.
- Consumers (21 files repointed to `-base` by the interrupted run, imports flipped back to `components/dropdown-menu` in the finalize step): book (`folder-tree`, `nav-user`, `topic-switcher`), cortex-ai (`nav-chats`, `nav-projects`, `nav-user`, `workspace-switcher`), expense-tracker (`mode-toggle`, `organisms/sidebar/nav-user`, `transactions/transaction-table`), housie-game (`mode-toggle`), poker-planner (`mode-toggle`, `organisms/poker-board/participant-card`), portfolio (`toggle-theme`), scribble (`mode-toggle`), secret-santa (`mode-toggle`), web (`showcase/overlays-menus-section`), packages/ui (`ai-elements/prompt-input`, `data-table/data-table-column-header`, `elevenlabs/mic-selector`, `elevenlabs/audio-player-speed`).
- Call-site fixes by this agent:
  - `apps/book/components/topic-switcher.tsx` — `onOpenChange` event details: `eventDetails.preventDefault()` → `eventDetails.cancel()` (Base UI `ChangeEventDetails` API).
  - `apps/web/components/showcase/overlays-menus-section.tsx` — 2× `DropdownMenuItem onSelect={() => undefined}` → `onClick={() => undefined}`.
  - `packages/ui/src/components/ai-elements/prompt-input.tsx` — `PromptInputActionAddScreenshot`: `onSelect={handleSelect}` on the item → `onClick={handleSelect}` (handler retyped `Event` → `ReactMouseEvent<HTMLDivElement>`); its public `onSelect` prop contract is preserved and still honors `event.preventDefault()` for the screenshot action itself. Matches the pattern the interrupted run applied to `PromptInputActionAddAttachments`.
- Call-site fixes by the interrupted run (verified, not redone): `packages/ui/src/components/elevenlabs/mic-selector.tsx` — item `onSelect` → `onClick` + `closeOnClick={false}`; `audio-player-speed.tsx` — `onClick` conversion was already in place.

## Left alone

- `MenubarItem`/`CommandItem` `onSelect` props in `apps/web/components/showcase/overlays-menus-section.tsx` — different components (menubar/command), out of scope.
- Sibling in-flight migrations (button, select, alert-dialog, tabs, slider, popover, etc.) — not touched; their `M` entries in `git status` are theirs.
- All `package.json`/lockfile/`globals.css`/`components.json` files and the untracked highlighter files per hard rules.
- `data-[side=...]` classes: Base UI also emits `inline-start`/`inline-end` sides that Radix never did, but all dropdown consumers here use `top`/`bottom`/`left`/`right` anchoring only, so existing `data-[side=*]` classes keep working.

## Behavior changes

- Item elements are `<div>`s (Base UI), not Radix's button-based items; `focus:` highlighting replaced by `data-highlighted:`.
- `onSelect` compat shim: Base UI has no `onSelect` and closes on click based on the `closeOnClick` prop (default `true`), not the event's `defaultPrevented`. So `event.preventDefault()` inside the deprecated `onSelect` shim no longer keeps the menu open — consumers relying on that must use `closeOnClick={false}` (mic-selector does). Affected edge case: `PromptInputActionAddScreenshot` consumers calling `preventDefault` now see the menu close (menu behavior only; screenshot action is still suppressed).
- `PromptInputActionAddScreenshot`'s `onSelect` receives a React `MouseEvent` instead of a Radix synthetic `Event` — `preventDefault`/`defaultPrevented` still work.
- `DropdownMenuLabel` inside a group is now an accessible `GroupLabel` wired via `aria-labelledby`; standalone labels render a plain `div` (a11y-neutral fallback).
- `modal` default is `true` in both libs; Base UI menus opened by hover are never modal, and nested menus ignore `modal` — no dropdown consumer here uses hover-opened menus.
- Checkbox items: `closeOnClick` defaults to `false` in Base UI, matching Radix's non-closing checkbox behavior. No change in practice.

## Verify by hand

- Open a dropdown in any repointed app (e.g. book topic switcher, cortex-ai workspace switcher): open/close animations, submenu hover, keyboard navigation (arrows, Escape, typeahead), highlight styling, disabled items.
- book topic-switcher delete-button edge case: press the delete button inside the menu row — menu must stay open (previously `eventDetails.preventDefault()`, now `cancel()`).
- mic-selector: selecting a device keeps the menu open (closeOnClick={false}); the mute/waveform footer still works.
- audio-player-speed: clicking a speed closes the menu and applies the rate.
- prompt-input screenshot action: attaching still works; menu closes after a successful capture.
- web showcase overlays/menus section: profile/destructive demo items render and highlight.
