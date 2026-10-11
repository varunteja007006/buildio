# Agent Instructions

This is a pnpm 11.4 + Turborepo monorepo of Next.js 16 apps. Run commands from `buildio_pro/` (the parent `Buildio/` directory contains only workspace-level docs and license files). Node.js `>=20` is required.

## Commands

- `pnpm install` installs the workspace.
- `pnpm build` builds all apps; `pnpm build:<app>` builds one app. Use the corresponding `start:<app>` script for a production build.
- `pnpm lint` runs all workspace lint tasks. Each app also has `lint:fix` and `typecheck`; use `pnpm --filter=<app> typecheck` for focused checking.
- There are no test scripts or test framework in this repository.
- `pnpm format` runs Prettier on `ts`, `tsx`, and `md`; it does not sort imports. ESLint's `import/order` rule handles import ordering.
- Do not use `pnpm check-types`: Turbo defines that task, but packages expose `typecheck` instead.
- Avoid `pnpm dev` and app dev scripts unless explicitly requested. `pnpm clean` and `pnpm clean:all` use destructive `git clean`; prefer `pnpm clean:workspaces` or a package-specific clean script.

## Workspace Boundaries

- `apps/web` is the landing page.
- `apps/expense-tracker` is a tRPC + better-auth + Drizzle/Postgres/Valkey app.
- `apps/cortex-ai` is an AI chat/RAG app using HTTP API modules, better-auth, Drizzle, and UploadThing.
- `apps/poker-planner`, `apps/housie-game`, and `apps/scribble` are Convex-backed realtime games.
- `packages/ui` is the shared UI registry. Search `packages/ui/src/components/` before creating UI; import it as `@workspace/ui/...`, never by relative path. Add missing shadcn components with `pnpm dlx shadcn@latest add <name> -c apps/web`, which installs into the shared package. `cortex-ai` uses the same shared UI package; do not install components with `-c apps/cortex-ai`.
- Workspace packages are consumed through `@workspace/*` exports. Keep new dependencies in the `catalog`/`react19` catalogs in `pnpm-workspace.yaml` rather than hardcoding catalog-managed versions.

## Data And Generated Code

- Copy the relevant app `.env.example` to `.env`; required variables are listed in `turbo.json` `globalEnv`. Database scripts require a usable `DATABASE_URL`.
- For Drizzle schema changes, run the app's `db:generate` and apply the migration with `db:migrate`; a generated but unapplied migration breaks runtime reads. Scope database operations to the authenticated workspace and validate ownership, not just a resource id.
- In `expense-tracker`, reuse shared schemas from `lib/db/zod-schema/` in both tRPC routers and forms. Protected routers live in `lib/trpc/routers/` and must be merged into the app router.
- In `cortex-ai`, keep API code feature-oriented under `api/` and register endpoints in `api/endpoints.ts`. Ask whether a new delete should be soft or hard. Soft deletes require `deletedAt`, active-read filters, restore/permanent-delete routes, and a reachable trash UI; immutable audit/version tables are never deleted.
- The shared Convex backend is `packages/games-convex-backend/convex/`; generated APIs are imported from `@workspace/games-convex-backend/convex/_generated/api`. Its generated files are committed. Read `convex/_generated/ai/guidelines.md` and `packages/games-convex-backend/convex_rules.txt` before changing Convex code. Use object-form functions (`query({ args, returns, handler })`, and corresponding mutation/action forms), argument validators, and `v.null()` for null returns.
- Run `pnpm dev` inside `packages/games-convex-backend` only when Convex code generation/watch mode is explicitly needed. Railway configs deploy Convex before building the three game apps.

## Plans And Workflow

- If work changes an existing plan, update both the plan checklist/status and its app index at `apps/<app>/docs/plans/plan.md`. Keep the index as `filename | short desc | status`; move completed plans to `docs/plans/done/` and mark them `✅`.
- Before editing, inspect `git status` and preserve unrelated user changes. Do not reset, checkout, amend, commit, or push unless explicitly requested. Before pushing, run `pnpm build`.
- Keep files below the configured ESLint `max-lines` limit of 250 lines (comments and blank lines excluded); split page, form/dialog, table-column, and reusable-control code when necessary.

## Deployment

Railway definitions are the `*-railway.toml` files at the workspace root. They use `pnpm build:<app>` and `pnpm start:<app>`; the Convex game builds run `npx convex deploy` first.

## End-to-end CRUD

- A database feature is not complete after changing the Drizzle schema. Generate the migration and apply it to the target database with the app's `db:generate` and `db:migrate` scripts. A generated but unapplied migration causes runtime 500s when endpoints query the new table.
- Scope every database read and write to the authenticated user's workspace. Do not authorize a resource from its id alone; verify both resource ownership and workspace membership.
- Design CRUD around the complete lifecycle: active records, pagination, validation, updates, soft deletion, restore, and permanent deletion where required.
- For soft-deleted mutable entities, add a nullable `deletedAt`, filter active reads with `isNull(deletedAt)`, make `DELETE` set the timestamp, and provide restore and owner-authorized permanent-delete routes. Soft deletion must have a reachable trash/deleted view with restore and permanent-delete affordances.
- Use partial unique indexes for soft-deleted entities so uniqueness applies only to active rows: `WHERE deleted_at IS NULL`.
- Paginated list endpoints should return the records and stable metadata such as `page`, `pageSize`, `total`, and `pageCount`. Cap client-provided page sizes.
- Keep the client data layer feature-oriented: typed endpoint builders, thin fetchers, query-key factories, and mutation success handlers that invalidate the relevant feature queries.
- Reuse existing shared components before adding new ones. For comboboxes and selects, preserve the UI library's anchor sizing variables such as `var(--anchor-width)` instead of forcing an unrelated popup width.
- Portaled controls inside dialogs must render into the dialog content when the shared component supports a `container` ref. This keeps focus management, typing, scrolling, and keyboard interaction inside the dialog.
- Long dialogs should use a constrained viewport height with a fixed header and footer and an independently scrollable body. Keep large textareas and JSON editors inside that body.
- Split page, form/dialog, table-column, and reusable control code before files approach ESLint's 250-line limit.
