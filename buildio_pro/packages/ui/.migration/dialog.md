# dialog

2026-11-15 · in-place wrapper migration from `radix-ui` to `@base-ui/react/dialog` (render-prop shim for `asChild`) · ✅ migrated, Radix-free

Same treatment as `alert-dialog.md` (2026-11-14), applied to `packages/ui/src/components/dialog.tsx`. ~40 consumer files, none importing `DialogOverlay`/`DialogPortal`; all `<Dialog>` usage passes only `open`/`onOpenChange`.

## Changed

- Import: `radix-ui` → `@base-ui/react/dialog`.
- Anatomy renames: `Overlay` → `Backdrop` (export name `DialogOverlay` kept), `Content` → `Popup`. Base UI has no Positioner part for dialogs — the popup keeps self-centering with `translate-x-[-50%] translate-y-[-50%]`.
- State attrs on Backdrop and Popup: `data-[state=open]` → `data-open`, `data-[state=closed]` → `data-closed`.
- `asChild` shim on `DialogTrigger` and `DialogClose` (both deprecated JSDoc-tagged): valid-element child → `render={children}`. The `isValidElement` guard is load-bearing for `apps/scribble/components/game-settings-dialog.tsx:102`, which passes a forwarded `{children}` variable rather than a literal element.
- `DialogFooter`'s internal close: `<DialogPrimitive.Close asChild><Button variant="outline">Close</Button></DialogPrimitive.Close>` → `<DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>` (Base `Close` has no `asChild`; mirrors `AlertDialogAction`'s non-asChild path).

## Left alone

- All non-animated class strings byte-for-byte identical to the Radix original (only the import, the two animated class strings per Overlay/Popup, and the footer Close structure changed).
- `showCloseButton` wrapper prop (default `true` on `DialogContent`, `false` on `DialogFooter`) and the `ref?: React.Ref<HTMLDivElement>` forward on `DialogContent` — wrapper-level, Base UI needs no equivalent.
- Consumer call-sites untouched: `asChild` children across apps are native `<Button>` elements (no `nativeButton={false}` needed); no Radix-only callbacks (`onOpenAutoFocus`, `onEscapeKeyDown`, `onInteractOutside`) used anywhere; `command.tsx`'s `CommandDialog` spread still typechecks against `DialogPrimitive.Root`.

## Behavior changes

- Follow-up 2026-11-15: the built-in close button's inert `data-[state=open]:bg-accent data-[state=open]:text-muted-foreground` selectors were removed (Base UI's `Close` part never received the attribute). Hover/focus feedback unaffected.
- Follow-up 2026-11-15: `data-closed:fill-mode-forwards` added to Backdrop and Popup to fix the end-of-close backdrop flash — see `animation-exit-flash.md`.
- Base UI popups unmount after the closing transition; `data-closed:animate-out` still applies during the ending phase, so exit animations are preserved.

## Verify by hand

- Radix sweep: `grep -n "radix-ui\|@radix-ui" packages/ui/src/components/dialog.tsx` → no matches.
- Web showcase dialog example: Backdrop fade in/out, Popup zoom in/out on open/close; X close button and footer Close both close.
- `apps/web/components/showcase/overlays-section.tsx:73,84,87` (`DialogTrigger asChild > Button`).
- scribble `game-settings-dialog.tsx` (forwarded-children `asChild` site) still opens.
- expense-tracker dialogs (income/expense/event/category/transaction forms + details) still open/close, incl. `DialogTrigger asChild` sites.
