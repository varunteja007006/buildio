# Notes inside folders: folder membership for books

**Status:** ✅ Completed — backend + frontend implemented; types regenerated
locally (not deployed).
**Goal:** Let books live inside folders. Folders existed for organizing but
contained nothing; this plan adds optional folder membership on books, a
per-folder bookshelf page, and sidebar navigation into folders.

## Design decisions

1. **Optional `folder_id` on books.** Books without a folder sit at the topic
   root, exactly like today; no backfill needed since absence reads as
   "unfiled". The `by_folder_created` index only matches filed books — unfiled
   books keep loading via the existing `by_topic_created` path.
2. **`create` validates membership, not the folder page.** `books.create`
   takes an optional `folderId`, bounded-checks the folder exists, and throws
   when it belongs to a different topic.
3. **Deleting a folder unfiles, never deletes.** `bookFolders.remove` keeps
   its BFS subtree deletion and, for every folder in the deleted subtree,
   patches contained books' `folder_id` back to undefined. Notes are never
   silently destroyed (same principle as topic delete blocking when
   non-empty). Bounded by the existing per-folder scan caps.
4. **Folder pages live under `/home/notes/f/[folderId]`.** Same shell
   (TopicProvider → SidebarProvider → AppSidebar → SidebarInset) as
   `/home/notes`; the list is `api.books.listByFolder` (newest first,
   paginated, 12/page with "Load more").
5. **Sidebar rows navigate; chevron toggles.** Folder rows became links to
   the folder page; the disclosure chevron keeps the expand/collapse role
   (stopPropagation so it never follows the link). Rename/delete/favorite
   stay in the per-row menu, which is a sibling of the link.

## Backend (`packages/book-convex-backend`)

- [x] `schema.ts`: `books.folder_id: v.optional(v.id("book_folders"))` +
  index `by_folder_created: ["folder_id", "createdAt"]` (repaired a malformed
  index chain left mid-edit).
- [x] `books.ts` `create`: optional `folderId` arg with existence +
  same-topic validation; insert sets `folder_id`.
- [x] `books.ts` `listByFolder`: paginated, newest-first via
  `by_folder_created`, same page-item shape as `list` (shared
  `bookItem`/`paginatedBooks` validators + `toBookItem` mapper).
- [x] `bookFolders.ts` `remove`: unfile books inside deleted folders
  (patch `folder_id: undefined`), bounded per folder, before deleting each.
- [x] `npx convex codegen` regenerated `_generated` (no deploy; dev
  deployment untouched).

## Frontend (`apps/book`)

- [x] `app/home/notes/f/[folderId]/page.tsx`: folder contents page with the
  shared shell, breadcrumb (Home → Notes → folder path), and heading.
- [x] `components/books/folder-bookshelf.tsx`: paginated grid via
  `api.books.listByFolder`, "Add note" (opens `AddBookDialog` with
  `folderId`), "Load more", graceful folder-not-found state.
- [x] `components/books/folder-breadcrumb.tsx`: topic/folder path breadcrumb
  with ancestor links and not-found handling.
- [x] `components/folder-tree.tsx` + `components/folder-menu.tsx` (extracted):
  folder rows navigate to the folder page, active folder highlighted via
  `usePathname`; menu affordances unchanged.
- [x] `components/books/add-book-dialog.tsx`: optional `folderId` prop passed
  to `api.books.create`.
- [x] Every file stays under the 250-line ESLint cap.

## Verification

- [x] `pnpm --filter=book typecheck` and `pnpm --filter=book lint` pass.
- [ ] Manual smoke (needs the dev deployment refreshed via `convex dev`):
  1. Create a note inside a folder from the folder page; it appears there.
  2. Sidebar folder rows navigate; the active folder is highlighted.
  3. Deleting a folder keeps its notes on the topic-root bookshelf.
  4. Books created from the topic shelf stay unfiled.
