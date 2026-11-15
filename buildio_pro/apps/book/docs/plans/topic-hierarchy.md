# Topic hierarchy: topics → folders → books

**Status:** 🔄 In progress — Phases 1–3 implemented and deployed to the dev
deployment; manual smoke testing remains.
**Goal:** Make the sidebar topic switcher actually scope data. Switching topics swaps the
folder tree and the bookshelf; each topic owns its folders and books. Today all three
tables are global and the topic switcher only persists a localStorage id.

## Design decisions

1. **Required `topic_id`, not optional.** Convex indexes do not match `undefined`
   fields (the existing `by_parent` top-level workaround exists for exactly this
   reason). Optional fields would push that pain into the main list path. Fields are
   required and a one-time backfill assigns legacy rows to the default topic.
2. **Two-step deploy.** Convex validates schema on read, so old rows missing
   `topic_id` would break a single-step deploy. Order: deploy with optional field +
   backfill mutation → run backfill → tighten to required → deploy again.
3. **Topic delete blocks when non-empty.** Deleting a topic with folders or books
   throws "Topic is not empty…". No cascade (reading notes must not be silently
   destroyed), matches the existing "permanently deleted" dialog copy.
4. **Favourites stays global.** `/home/favourites` remains a cross-topic view.
5. **Folder membership of books is deferred.** The diagram implies books live in
   folders; this plan ships topic scoping first (books = topic root). Adding an
   optional `folder_id` on books is a follow-up plan.

## Phase 1 — Backend (`packages/book-convex-backend`)

Read `convex/_generated/ai/guidelines.md` before editing. Object-form functions,
validators, `v.null()` returns throughout.

- [ ] `schema.ts`:
  - `book_folders.topic_id: v.optional(v.id("book_topics"))` + index
    `by_topic_created: ["topic_id", "created_at"]` (serves per-topic list order and
    the per-topic main-folder count).
  - `books.topic_id: v.optional(v.id("book_topics"))` + index
    `by_topic_created: ["topic_id", "createdAt"]` (paginated newest-first per topic).
- [ ] New temporary `backfill.mts`-style `internalMutation` `backfillTopicAssignments`:
  ensure default topic exists (reuse `ensureDefault` logic), then patch every
  folder/book missing `topic_id` to the default topic id. Bounded scans consistent
  with existing caps.
- [ ] `bookFolders.ts`:
  - `list` → `args: { topicId: v.id("book_topics") }`, query via
    `by_topic_created`, return shape unchanged.
  - `create` → add `topicId` arg; main-folder count and top-level duplicate scan
    filter by `topic_id` (keep the bounded `by_created_at` scan approach); insert
    sets `topic_id`.
  - `rename` / `remove` / `setFavorite` unchanged (implicit scoping by id).
- [ ] `books.ts`:
  - `list` → `args: { topicId, paginationOpts }` via `by_topic_created`.
  - `create` → add `topicId` arg; insert sets `topic_id`. Title-uniqueness scan
    stays global (titles unique across topics — simplest and matches current UX).
  - `listFavorites` unchanged (global).
- [ ] `bookTopics.ts`: `remove` throws `ConvexError("Topic is not empty — delete or
  move its books and folders first")` when the topic has folders or books.
- [ ] Deploy step A (`npx convex deploy` via the pseudo-TTY prompt script), run
  `npx convex run backfillTopicAssignments` against the book deployment, verify rows.

## Phase 2 — Backend tightening + cleanup

- [ ] Flip `topic_id` to required `v.id("book_topics")` on both tables in `schema.ts`.
- [ ] Delete the temporary backfill mutation.
- [ ] Deploy step B; commit regenerated `convex/_generated/` diffs.

## Phase 3 — Frontend (`apps/book`)

- [ ] New `components/topic-provider.tsx` (client): context holding
  `activeTopicId` / `activeTopic` / `setActiveTopicId`, reusing the
  `localStorage["book:active-topic"]` key and the fallback/auto-select logic that
  currently lives in `topic-switcher.tsx`. Provider sits above both sidebar and page
  content; since each `/home/*` page renders its own `SidebarProvider`, add a small
  shared client shell (or wrap `TopicProvider` in each page) — no context split
  between sidebar and bookshelf.
- [ ] `topic-switcher.tsx`: consume the context instead of owning state; deletion
  fallback ("select default/first remaining topic") moves to the provider.
- [ ] `nav-main.tsx`: `useQuery(api.bookFolders.list, topicId ? { topicId } : "skip")`
  via context; `FolderCreateDialog` receives and passes `topicId`.
- [ ] `bookshelf.tsx`: `usePaginatedQuery(api.books.list, { topicId, paginationOpts })`
  with `"skip"` until the topic resolves; pagination resets naturally on topic change.
- [ ] `add-book-dialog.tsx`: pass `topicId` to `create`; disable submit until a topic
  is active.
- [ ] Verify `/home/favourites` and `/home/notes/[bookId]` need no changes
  (global favourites; book fetch by id).
- [ ] Keep every file under the 250-line ESLint cap; split if the switcher grows.

## Phase 4 — Verification

- [x] `pnpm --filter=book typecheck` and `pnpm --filter=book lint` both pass clean.
- [ ] `pnpm build` is not required (book backend is its own package; no shared
  catalog version changes) — run `pnpm --filter=book-convex-backend typecheck` if the
  package exposes one, else rely on the deploy's typecheck.
- [ ] Manual smoke (needs the deployed backend):
  1. Legacy folders/books all appear under the default "Second Brain" topic.
  2. Create a second topic → folder tree and bookshelf are empty.
  3. Add a folder and book there; switch back and forth — data follows topics.
  4. Deleting a non-empty topic errors cleanly; deleting an empty topic works and
     selection falls back to the default topic.
  5. Stale localStorage topic id falls back gracefully (already handled — retest).

## Deployment (resolved)

- `packages/book-convex-backend/.env.local` targets the **dev deployment
  `dashing-mongoose-518`** (project `book-convex-backend`, team `varunteja007006`).
  Pushes use `npx convex dev --until-success` from that package (keeps the dev
  deployment in sync and regenerates `convex/_generated/`). Not the prod
  deployment, so no extra consent gate needed.
