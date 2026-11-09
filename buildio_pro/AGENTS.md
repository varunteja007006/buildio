# Agent Instructions

This is a pnpm 11.4 + Turborepo monorepo of Next.js 16 apps (plus one Expo app). Run commands from `buildio_pro/` (the parent `Buildio/` directory contains only workspace-level docs and license files). Node.js `>=20` is required.

## Commands

- `pnpm install` installs the workspace.
- `pnpm build` builds all Next apps and packages; `pnpm build:<app>` builds one app. Use the corresponding `start:<app>` script for a production build.
- `pnpm lint` runs all workspace lint tasks. Each app also has `lint:fix` and `typecheck`; use `pnpm --filter=<app> typecheck` for focused checking.
- `pnpm build` does NOT cover `apps/eggsy` (Expo: no build script). For eggsy changes, run `pnpm --filter=eggsy typecheck` and `pnpm --filter=eggsy lint` instead.
- Tests: only `apps/billezy` has tests (`pnpm --filter=billezy test`, `node --test tests/*.test.mjs`). `tests/convex.integration.test.mjs` needs a deployed Convex URL set in `BILLEZY_TEST_CONVEX_URL` (also declared in `turbo.json`).
- `pnpm format` runs Prettier on `ts`, `tsx`, and `md`; it does not sort imports. ESLint's `import/order` rule handles import ordering.
- Do not use `pnpm check-types`: Turbo defines that task, but no workspace package exposes it; they expose `typecheck` instead.
- Avoid `pnpm dev` and app dev scripts unless explicitly requested. `pnpm clean` and `pnpm clean:all` use destructive `git clean`; prefer `pnpm clean:workspaces` or a package-specific clean script.

## Dependencies And Version Bumps

- There are many apps sharing catalogs; a version bump in the shared `catalog:` or `react19` catalog (and in `packages/ui`) affects every app that uses it. Do not assume one app compiles means all do: after changing any dependency version, verify with `pnpm build` (all apps), plus `pnpm --filter=web typecheck` if shared packages changed.
- New dependencies: pin the exact version (no `^`/`~`). If the package is used by more than one app (or plausibly soon will be), add it to the `catalog` in `pnpm-workspace.yaml` and consume it via `"catalog:"`, not a hardcoded version. React types also live in the `react19` catalog.
- Renovate enforces this policy (`renovate.json`): `:pinDependencies`, `rangeStrategy: pin`, weekly schedule, `minimumReleaseAge: 10 days` (security fixes bypass it). `pnpm-workspace.yaml` additionally sets `minimumReleaseAge: 10080` (7 days) with an allowlist of newer packages, and keeps security `overrides` pinning minimum versions — leave those entries intact unless intentionally changing policy.
- `pnpm-workspace.yaml` `allowBuilds` lists the packages allowed to run postinstall build scripts; add entries there when a new package's scripts need to run.

## Workspace Boundaries

- `apps/web` is the landing page; `apps/portfolio` is a plain Next.js personal site (no backend).
- `apps/expense-tracker` is a tRPC + better-auth + Drizzle/Postgres/Valkey app.
- `apps/cortex-ai` is an AI chat/RAG app using HTTP API modules, better-auth, Drizzle, and UploadThing.
- `apps/poker-planner`, `apps/housie-game`, `apps/scribble`, `apps/secret-santa`, and `apps/billezy` are Convex-backed apps sharing `packages/games-convex-backend`.
- `apps/book` is a Next.js + Mantine + BlockNote app on its own backend, `packages/book-convex-backend` (shared `packages/theme`).
- `apps/eggsy` is Expo/React Native (SDK 56) + Convex with its own local `apps/eggsy/convex/`. Expo APIs change per release: read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing eggsy code.
- `packages/ui` is the shared UI registry. Search `packages/ui/src/components/` before creating UI; import it as `@workspace/ui/...`, never by relative path. Add missing shadcn components with `pnpm dlx shadcn@latest add <name> -c apps/web`, which installs into the shared package. Other apps share that package too; do not install components with `-c apps/<other-app>`.
- Workspace packages are consumed through `@workspace/*` exports.
- Ignore `buildio_pro/convex/` — a stray committed `_generated/` directory that belongs to no workspace package.

## Data And Generated Code

- Copy the relevant app `.env.example` to `.env`; required variables are listed in `turbo.json` `globalEnv`. Database scripts require a usable `DATABASE_URL`.
- For Drizzle schema changes, run the app's `db:generate` and apply the migration with `db:migrate`; a generated but unapplied migration breaks runtime reads. Scope database operations to the authenticated workspace and validate ownership, not just a resource id.
- In `expense-tracker`, reuse shared schemas from `lib/db/zod-schema/` in both tRPC routers and forms. Protected routers live in `lib/trpc/routers/` and must be merged into the app router.
- In `cortex-ai`, keep API code feature-oriented under `api/` and register endpoints in `api/endpoints.ts`. Ask whether a new delete should be soft or hard. Soft deletes require `deletedAt`, active-read filters, restore/permanent-delete routes, and a reachable trash UI; immutable audit/version tables are never deleted.
- The shared Convex backend is `packages/games-convex-backend/convex/` (bills/presence/rails for several apps); `book` and `eggsy` have separate Convex trees. Apps import the generated API from the backend package's `convex/_generated/api`. Generated files are committed. Before changing Convex code, read `packages/games-convex-backend/convex_rules.txt` and the corresponding `_generated/ai/guidelines.md` where present (eggsy and book have one). Use object-form functions (`query({ args, returns, handler })`, and corresponding mutation/action forms), argument validators, and `v.null()` for null returns.
- Run `pnpm dev` inside `packages/games-convex-backend` only when Convex code generation/watch mode is explicitly needed.
- If work changes an existing plan, plans live in `apps/<app>/docs/plans/` (currently cortex-ai). Update the plan checklist/status and its `plan.md` index (`filename | short desc | status`); move completed plans to `docs/plans/done/` and mark them `✅`.
- Before editing, inspect `git status` and preserve unrelated user changes. Do not reset, checkout, amend, commit, or push unless explicitly requested. Before pushing, run `pnpm build`.
- Keep files below the configured ESLint `max-lines` limit of 250 lines (comments and blank lines excluded); split page, form/dialog, table-column, and reusable-control code when necessary.

## Deployment

- `billezy` runs on **Netlify**: the site builds from the pushed repo (`netlify.toml` is gitignored/local-only), and `NEXT_PUBLIC_CONVEX_URL` points at the production Convex deployment `next-condor-138.convex.cloud`. A `billezy-railway.toml` also exists (its build step runs `npx convex deploy` from `packages/games-convex-backend`); treat a second hosting path for the same app as suspicious and ask before changing either.
- `poker-planner-railway.toml`, `scribble-railway.toml`, `secret-santa-railway.toml`, and `billezy-railway.toml` deploy Convex during their build (`npx convex deploy` from `packages/games-convex-backend`) then build/start the app; `housie-game-railway.toml` does not deploy Convex.

### Deploying Convex changes manually

- `packages/games-convex-backend/.env.local` sets `CONVEX_DEPLOYMENT` to the dev deployment (`colorless-squirrel-700`) — that is the deployment `convex dev` keeps in sync.
- `npx convex deploy` from `packages/games-convex-backend` does NOT deploy to the dev deployment: when `CONVEX_DEPLOYMENT` is set, the CLI targets the project's default **production** deployment (`next-condor-138.convex.cloud`). No `--prod` flag or `CONVEX_DEPLOY_KEY` is needed locally, and this same command runs inside the Railway build steps above.
- That push triggers a Y/n confirmation which aborts in non-interactive shells ("Cannot prompt for input in non-interactive terminals"). `yes | npx convex deploy` does NOT bypass it (the CLI checks `stdin.isTTY`); there is no `--yes` flag and no `script` binary. Run it under a pseudo-TTY that answers the prompt: `python3 /home/varun/Documents/workspace/github/scripts/convex-deploy-prod.py`.
- The deploy typechecks the functions and regenerates `convex/_generated/`; check `git status` afterwards and fold any generated-file diffs into a commit before pushing.

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
