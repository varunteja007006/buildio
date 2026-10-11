# Games Convex backend

Shared Convex functions for `poker-planner`, `housie-game`, and `scribble`.

- Apps import the generated API from `@workspace/games-convex-backend/convex/_generated/api`.
- Use object-form functions with argument and return validators; return `v.null()` for null results.
- Generated files in `_generated/` are committed. To regenerate or watch them, run `pnpm dev` from `packages/games-convex-backend/` when needed.
- Read `../convex_rules.txt` and `_generated/ai/guidelines.md` before changing Convex functions.

Production deployments run through the game Railway configs at the workspace root.
