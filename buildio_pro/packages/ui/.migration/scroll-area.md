# scroll-area

2026-11-12 · strangler-fig (scroll-area-base.tsx → repoint consumers → typecheck → finalize) · ✅ migrated to Base UI 1.9.0, typechecks clean, no Radix references remain.

## Changed

- `packages/ui/src/components/scroll-area.tsx`: import swapped from `radix-ui` (`ScrollArea as ScrollAreaPrimitive`) to `@base-ui/react/scroll-area`. Part names verified against the installed d.ts: `Root`, `Viewport`, `ScrollAreaScrollbar`→`Scrollbar`, `ScrollAreaThumb`→`Thumb`, `Corner` all exist under the `ScrollArea` namespace.
- Viewport children are now wrapped in `<ScrollAreaPrimitive.Content>` (new part in Base UI, absent in Radix). It renders a `role="presentation"` div with `minWidth: fit-content` and owns the ResizeObserver that recomputes thumb positions when content resizes — required for correct thumb behavior. This mirrors Radix's internal `min-width: 100%; display: table` wrapper, so it is not a new layer of nesting.
- `ScrollBar` prop types now reference `ScrollAreaPrimitive.Scrollbar` instead of `ScrollAreaPrimitive.ScrollAreaScrollbar`.
- All Tailwind classes are byte-identical to the Radix version. The old wrapper used no Radix data-attribute selectors (no `data-[state=visible]` etc.), so no attribute renames were needed in CSS.
- Consumers repointed then flipped back (final state: `@workspace/ui/components/scroll-area`): apps/scribble/components/chat-box.tsx, apps/web/components/showcase/data-section.tsx, apps/cortex-ai/components/audit-logs/audit-log-details-dialog.tsx, apps/cortex-ai/components/audit-logs/document-audit-details-dialog.tsx, apps/cortex-ai/components/pages/connector-description-dialog.tsx, packages/ui/src/components/UploadedFiles.tsx, packages/ui/src/components/date-time-picker.tsx, packages/ui/src/components/ai-elements/suggestion.tsx. No call-site props needed fixing — consumers only pass `className`, `orientation`, and plain div spreads, all supported by Base UI Root/Scrollbar.

## Left alone

- No package.json, pnpm-lock.yaml, globals.css, components.json, untracked files, or animate-ui/* touched. No commits.
- `packages/ui/src/styles/globals.css` untouched.
- Consumer logic untouched beyond the import path (verified byte-level: only the import lines changed).

## Behavior changes

- Scrollbars unmount when their axis has no overflow (`keepMounted` defaults to `false` in Base UI; verified in ScrollAreaScrollbar.js: `shouldRender = keepMounted || !isHidden`). Radix always rendered the scrollbar div. Invisible in practice since the thumb was never visible without overflow.
- Scrollbar data attributes differ: Base UI applies `data-scrolling`, `data-hovering`, `data-has-overflow-x/y`, `data-overflow-x/y-start/end` (no `data-state`). No wrapper CSS or consumer referenced these, so no visual change.
- Scrollbar/Thumb sizing is now driven by Base UI CSS variables (`--scroll-area-thumb-height/width`) applied as inline styles by the parts themselves; Base UI also self-positions the scrollbar (`position: absolute` inline style), so the wrapper's positional classes behave as before.
- Base UI Root does not have Radix's `type` prop; no consumer used it.
- `suggestion.tsx`'s exported `SuggestionsProps = ComponentProps<typeof ScrollArea>` now resolves to Base UI Root props (still extends div props, so call sites are unaffected).

## Verify by hand

- apps/web showcase → ScrollArea example: vertical list (h-32) and horizontal strip (`ScrollBar orientation="horizontal"`) — check thumb drag, track click, wheel-on-scrollbar.
- packages/ui date-time-picker: horizontal scrollbars hidden with `sm:hidden` class on mobile/tablet breakpoint; calendars still scroll.
- packages/ui UploadedFiles: horizontal scrollbar over the file grid.
- cortex-ai audit-log / document-audit / connector-description dialogs: `max-h-[70vh]` / `min-h-0 flex-1` scrolling with `pr-4` spacing intact.
- scribble chat-box: `h-full p-2` message list scrolls.
- Corner rendering when both axes overflow (e.g. web showcase horizontal strip inside a vertical container).

Note: sibling migrations (button, accordion, tabs, slider, select, popover, alert-dialog, context-menu, dropdown-menu) are in flight in this repo; unrelated typecheck noise in other files may be their work.
