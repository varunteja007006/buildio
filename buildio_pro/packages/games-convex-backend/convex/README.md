# Games Convex backend

Shared Convex functions for `poker-planner`, `housie-game`, and `scribble`.

- Apps import the generated API from `@workspace/games-convex-backend/convex/_generated/api`.
- Use object-form functions with argument and return validators; return `v.null()` for null results.
- Generated files in `_generated/` are committed. To regenerate or watch them, run `pnpm dev` from `packages/games-convex-backend/` when needed.
- Read `../convex_rules.txt` and `_generated/ai/guidelines.md` before changing Convex functions.

Production deployments run through the game Railway configs at the workspace root.

The daily legacy stroke sweep removes Scribble strokes older than 24 hours that have no `created_at` timestamp. It preserves recently updated strokes, strokes still referenced by a match, and strokes in rooms that may still use the legacy canvas.

After deploying, these one-time maintenance mutations can be run from the Convex dashboard with `{}`. Each schedules its own continuation when there are more rows to process.

- `cleanup:deleteOrphanedStoryPoints` removes Poker Planner votes whose parent story is missing.
- `cleanup:purgeLegacyScribbleGameState` empties the unused `scribble_game_state` table. Run it after confirming that the deployed release and its rollback target have no readers or writers for the table.
