# alert-dialog

2026-11-14 · in-place wrapper migration from `radix-ui` to `@base-ui/react/alert-dialog` (render-prop shim for `asChild`) · ✅ migrated, typechecked, Radix-free

The wrapper in `packages/ui/src/components/alert-dialog.tsx` had already been migrated to `@base-ui/react/alert-dialog` by a previous session that was cut short by a usage limit; consumers were never repointed and the report below never existed. This session completed the interrupted work by verifying the migrated wrapper against `packages/ui/node_modules/@base-ui/react/alert-dialog` d.ts files and typechecking every affected app. **No further code changes were required** — the prior migration was complete and correct. Sibling migrations were in flight while this was verified (select starting, dropdown-menu finishing; `packages/ui/src/styles/globals.css` was being edited by them to add the `shadcn/tailwind.css` import that defines the `data-open`/`data-closed` variants used below).

## Changed

Nothing — verified-only pass. The wrapper diff (vs `HEAD`, done by the previous session) stands as:

- Import: `radix-ui` → `@base-ui/react/alert-dialog`.
- Anatomy renames: `Overlay` → `Backdrop`, `Content` → `Popup`. `Action`/`Cancel` both map to Base UI's `Close` (Base UI has no separate Action/Cancel parts — every `Close` closes the dialog, which matches Radix semantics where Action and Cancel both close).
- State attrs: `data-[state=open]` → `data-open`, `data-[state=closed]` → `data-closed` on Backdrop and Popup (verified against `DialogBackdropDataAttributes.d.ts` / `DialogPopupDataAttributes.d.ts`: `data-open`, `data-closed`, plus `data-starting-style`/`data-ending-style` available if needed later).
- `asChild` shim on `AlertDialogTrigger`, `AlertDialogAction`, `AlertDialogCancel`: accepts the deprecated Radix `asChild` prop and converts a valid-element child to Base UI's `render={children}` — same pattern as `TooltipTrigger` in `tooltip.tsx` and `PopoverTrigger` in `popover.tsx`.
- `AlertDialogAction`/`AlertDialogCancel` non-asChild path: previously `<Button variant size asChild><Action/Cancel/></Button>`; now `Close render={<Button variant size/>}` so the Button styling and the close behavior land on one element without the Radix asChild nesting.

## Left alone

- All non-animated class strings are byte-for-byte identical to the Radix original (verified with a string-level diff of the file: only the import, the two animated class strings, and the Action/Cancel structure changed).
- No `--transform-origin` var added: the original centered the popup with `translate-x-[-50%] translate-y-[-50%]` and never used `origin-(--transform-origin)`, and Base UI's `DialogPopupCssVars` only exposes `--nested-dialogs` anyway.
- All consumer call-sites: none needed changes. All `asChild` children across consumers are `<Button>` elements (native buttons, so no `nativeButton={false}` handling à la `button.tsx` is required). No Radix-only callbacks (`onOpenAutoFocus`, `onEscapeKeyDown`, `onInteractOutside`) are used anywhere; consumer props are just `className`, `onClick`, `disabled`, `variant`, `size`.
- `apps/*/components/*/user-registration-dialog.tsx` etc. were NOT touched.

## Behavior changes

- Minor, cosmetic-parity-level only: with `asChild` on `AlertDialogAction`/`AlertDialogCancel`, the internal default `<Button>` wrapper is bypassed (the consumer's child element is rendered directly). In Radix the consumer's `<Button variant=...>` classes won the twMerge merge anyway, so rendered output is equivalent. Any `className` passed alongside `asChild` on Action/Cancel is now dropped (no consumer does this).
- `data-slot` on Action/Cancel merges onto the rendered Button element via Base UI's `mergeProps` (Radix Slot did the same).
- Base UI Close renders a `<button>` like Radix Action/Cancel did; Escape/Outside-press/no-modal behavior comes from `AlertDialog.Root` with the same prop names (`open`, `onOpenChange`).

## Verify by hand

- Typecheck: `pnpm --filter=expense-tracker typecheck`, `poker-planner`, `scribble`, `web`, `cortex-ai`, `book`, `secret-santa` — all clean (only apps with alert-dialog consumers).
- Radix sweep: `grep -n "radix-ui\|@radix-ui" packages/ui/src/components/alert-dialog.tsx` → no matches.
- Visual: open the web showcase AlertDialog example ("Delete workspace") — Backdrop fade in/out and Popup zoom in/out on open/close; destructive Action and outline Cancel both close the dialog.
- expense-tracker delete dialogs (income, income-source, expenses, budget, event, category, transaction) — trigger-as-Button opens, Action with `onClick` fires and closes.
- `logout-btn.tsx` (poker-planner/scribble/secret-santa): nested `AlertDialogTrigger asChild > TooltipTrigger asChild > Button` chain still opens the dialog from the tooltip-wrapped button.
