# avatar

2026-11-12 — strategy: transformation engine on a `-base` file left by an interrupted sibling migration; wrapper was pristine vs the radix golden (classes preserved verbatim, import-only change). Verdict: migrated cleanly to `@base-ui/react/avatar`, finalized in place. This run was completed manually by the orchestrator after the original subagent hit a free-usage limit mid-flight.

## Changed

- `packages/ui/src/components/avatar.tsx` (folded from `avatar-base.tsx`):
  - Import: `Avatar` from consolidated `radix-ui` → `@base-ui/react/avatar` (Root/Image/Fallback parts exist 1:1 in Base UI).
  - Everything else byte-identical: `data-size` sizing classes, `AvatarImage` aspect classes, `AvatarFallback` muted styling, `AvatarBadge`/`AvatarGroup`/`AvatarGroupCount` plain-span/div parts, all `data-slot`s, and the export list (`Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`). File is 109 lines.
- Consumers — during the interrupted run all 7 had been repointed to `avatar-base`; this run flipped their imports back to `@workspace/ui/components/avatar` (now the base implementation):
  - `apps/book/components/nav-user.tsx`, `apps/cortex-ai/components/nav-user.tsx`, `apps/expense-tracker/components/organisms/sidebar/nav-user.tsx`
  - `apps/poker-planner/components/user-card.tsx`, `apps/scribble/components/user-card.tsx`, `apps/secret-santa/components/user-card.tsx`
  - `apps/web/components/showcase/primitives-section.tsx`
- Leftover scan `grep -n "radix-ui|@radix-ui"` on this component's files: clean.

## Left alone

- `animate-ui/*` avatar variants (if any) — registry-owned.

## Behavior changes

- None expected: Base UI Avatar Image/Fallback map 1:1 to Radix's; fallback delay and image loading semantics are internal to the primitive.

## Verify by hand

- User avatar with a valid image renders the photo (expense-tracker/book/cortex-ai nav-user menus).
- Avatar with a broken/missing image shows initials fallback.
- Avatar badge dots size correctly on sm/default/lg.
