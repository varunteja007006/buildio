# Buildio.pro

Monorepo for buildio.pro — a pnpm + Turborepo workspace of Next.js 16 apps and shared packages.

## Structure

```text
apps/
  web                 Landing page (buildio.pro)
  expense-tracker     Full-stack expense tracker (tRPC + better-auth + Drizzle/Postgres)
  cortex-ai           AI RAG chat app (AI SDK + Drizzle + better-auth + uploadthing)
  poker-planner       Realtime poker planning (Convex)
  housie-game         Realtime housie/bingo game (Convex)
  scribble            Realtime drawing game (Convex)
packages/
  ui                  Shared shadcn/ui components + Tailwind v4 setup
  theme               Theme CSS files
  games-convex-backend Shared Convex backend for the games apps
  eslint-config       Shared ESLint config
  typescript-config   Shared tsconfig files
```

## Commands

Run everything from this directory (`buildio_pro/`).

```bash
pnpm install          # install deps
pnpm dev              # run all 6 apps
pnpm dev:web          # run a single app (also dev:expense-tracker, dev:cortex-ai, dev:poker-planner, dev:housie-game, dev:scribble)
pnpm build:<app>      # build a single app
pnpm start:<app>      # start a production build
pnpm format           # format TypeScript and Markdown with Prettier
```

See `AGENTS.md` for conventions: adding shadcn components, theme wiring, env setup, and deploy notes.

## Apps

### Realtime games (Convex)

`poker-planner`, `housie-game`, and `scribble` share the backend in `packages/games-convex-backend`. Run `pnpm dev` inside that package (`convex dev`) to watch and regenerate `_generated/`. Production deployments run `npx convex deploy` before the app build.

### Full-stack apps

`expense-tracker` and `cortex-ai` each have their own `.env.example` — copy it to `.env` before developing. All required variables are listed in `turbo.json` `globalEnv`.

## Adding a shadcn/ui component

Components for the shared apps install into `packages/ui/src/components`:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

`cortex-ai` also uses the shared UI package. Add components with `-c apps/web`; do not target `apps/cortex-ai`.

## Packages

### `@workspace/ui`

Shared shadcn/ui components. Import them in apps as `@workspace/ui/components/<name>` — never with relative paths.

### `@workspace/theme`

Tailwind v4 theme CSS. Apps wire it up in their `app/globals.css` via a theme `@import`.

### `@workspace/games-convex-backend`

Shared Convex backend for the games apps. Import generated APIs as `@workspace/games-convex-backend/convex/_generated/api`.
