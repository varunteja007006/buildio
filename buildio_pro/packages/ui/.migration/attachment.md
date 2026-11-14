# attachment

2026-11-14 — Slot → `useRender` migration. Verdict: clean, single occurrence (`AttachmentTrigger` only). Confirmed this is a local registry component (imports `Button` from `@workspace/ui`; not found in the `@diceui` registry — `diceui.com/r/attachment.json` 404s), so migrating does not break an external API contract. No app call site uses `asChild` on AttachmentTrigger (grep over `apps/` found no imports of bubble/attachment trigger families using it).

## Changed

- `packages/ui/src/components/attachment.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `AttachmentTrigger`: `const Comp = asChild ? Slot.Root : "button"` → `useRender({ render: isChildRender ? children : <button data-slot="attachment-trigger" />, props: {...} })`.
  - `type` handling preserved exactly: when NOT asChild, `type: type ?? "button"` (default button so it never submits a form); when asChild, `type` is dropped entirely (matches the old `type={asChild ? undefined : ...}`).
  - `children` now destructured and conditionally excluded from `props` when `asChild` + valid element child.
  - `asChild` kept as deprecated Radix-compat prop with the standard deprecation marker (button.tsx convention).
- Untouched (no Slot usage): `Attachment`, `AttachmentGroup`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction` (wraps `Button`, which already has its own Base UI `render`-based asChild shim).

## Left alone

- package.json / pnpm-workspace.yaml — no dependency edits.
- No app file edits (no `AttachmentTrigger`/`asChild` call sites found).

## Behavior changes

- None for current call sites. Edge case: `asChild` with non-element child now falls through to the default `<button data-slot="attachment-trigger">` path instead of Radix Slot's span fallback.

## Verify by hand

- `apps/web` showcase file-upload area (if exercised): the trigger overlay still covers the attachment tile (`absolute inset-0 z-10`), clicks on remove buttons in `AttachmentActions` (z-20) still win over the trigger overlay.
