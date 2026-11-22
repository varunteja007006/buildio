---
model: gpt-6.2-sol
last-updated: 22-11-2026
user: varunteja
---

# Rename usernames in Poker Planner, Secret Santa, and Scribble

Add **Change display name** to the profile menu. The change applies to every room using the same guest profile. The apps store guest tokens in browser storage for their own origins, so separate guest profiles keep their own names. Display names may repeat, as they do at registration. Room membership, owner and host permissions, votes, Secret Santa assignments and wishlists, and Scribble turns and scores continue to use the existing user ID.

## Implementation

- [x] Add `api.user.renameUser({ token, name })` in [the shared Convex user module](../../../packages/games-convex-backend/convex/user.ts). Resolve the caller through `getUserFromToken`, reject invalid tokens, and derive the row to patch from the token. Share the existing registration rule on the server. Trim surrounding whitespace and accept 1–100 characters after trimming. Patch only `users.username` and return `null`. Treat saving the current name as a successful no-op.
- [x] Add one dialog to the shared [profile menu](../../../packages/game-ui/src/components/user-card.tsx), which serves the default navbar and both custom game headers. Prefill the current name on each open. Use a labeled input with Enter to submit, Cancel to discard, a pending state that prevents duplicate saves, and an inline error that preserves the input on failure. Keep emoji and role controls independent. Truncate long names in the profile trigger on small screens and return focus to the trigger when the dialog closes.
- [x] Let the existing [user store subscription](../../../packages/game-ui/src/lib/store/user.store.tsx) refresh the profile menu after save. Poker Planner's room presence and per-user vote query already read user records. Secret Santa's participant list and private recipient name do the same, feeding the match card and wishlist heading.
- [x] Update [Scribble's match query](../../../packages/games-convex-backend/convex/scribbleMatch.ts) to use the profiles it already loads for the current drawer and scoreboard, including finished results. Fall back to the stored match name when a profile is missing. The lobby and chat already read current names, so existing chat messages display the renamed author. Keep the existing match schema and stored names so matches created before rollout still load. This approach requires no data migration.

## Verification

- [x] Verify valid renames, whitespace trimming, blank and over-limit input, the 100-character boundary, duplicate names, repeated saves, and invalid tokens on an isolated local Convex deployment. Verify that a separate session cannot target another profile and that a failed save leaves both profiles intact.
- [x] Verify live updates through separate Convex sessions. Poker Planner presence and vote queries picked up the new name, with the same vote hidden before reveal. Secret Santa kept the same private recipient and wishlist after the draw. Scribble updated the current drawer, chat, and final scores with the same turn, canvas ID, deadline, prompt visibility, and scores.
- [x] Exercise the shared profile menu in Chromium at a mobile viewport, including keyboard and touch entry, focus return, cancel, validation, server error and retry, and persistence after reload. Run lint for the shared UI and the three apps, and typecheck the shared backend and all three apps.

## What I need from you

Nothing for implementation.

## What next

Deploy the shared Convex backend with the three app releases.
