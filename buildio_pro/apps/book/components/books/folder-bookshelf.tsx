"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { usePaginatedQuery, useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import * as React from "react";

import { AddBookDialog } from "@/components/books/add-book-dialog";
import { BookCard } from "@/components/books/book-card";
import { useActiveTopic } from "@/components/topic-provider";

const PAGE_SIZE = 12;

/** Paginated bookshelf for one folder, with an add-note affordance. */
export function FolderBookshelf({
  folderId,
}: {
  folderId: Id<"book_folders">;
}) {
  const { topicId } = useActiveTopic();
  // Folder metadata is topic-scoped; skip until the topic resolves.
  const folders = useQuery(
    api.bookFolders.list,
    topicId !== null ? { topicId } : "skip",
  );
  const folder = folders?.find((candidate) => candidate.id === folderId);
  const { results, status, loadMore } = usePaginatedQuery(
    api.books.listByFolder,
    { folderId },
    { initialNumItems: PAGE_SIZE },
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const loaded = status !== "LoadingFirstPage";
  const isDone = status === "Exhausted";
  const countLabel = !loaded
    ? null
    : isDone
      ? `${results.length} ${results.length === 1 ? "note" : "notes"}`
      : `${results.length}+ notes`;
  // The folder list has loaded but this folder is not in it (deleted or
  // foreign topic).
  const notFound = folders !== undefined && !folder;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {notFound ? "Folder not found" : (folder?.name ?? "Folder")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {notFound
              ? "This folder no longer exists."
              : "Notes filed inside this folder."}
            {countLabel === null ? "" : ` (${countLabel})`}
          </p>
        </div>
        {!notFound ? (
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={topicId === null}
          >
            <PlusIcon />
            Add note
          </Button>
        ) : null}
      </div>

      {notFound ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          This folder does not exist or was deleted.
        </p>
      ) : !loaded ? (
        <p className="text-sm text-muted-foreground">Loading notes…</p>
      ) : results.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No notes in this folder yet. Add one to start writing.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                createdAt={book.createdAt}
                isFavorite={book.isFavorite}
              />
            ))}
          </div>
          {isDone ? null : (
            <Button
              type="button"
              variant="outline"
              className="self-center"
              disabled={status === "LoadingMore"}
              onClick={() => loadMore(PAGE_SIZE)}
            >
              {status === "LoadingMore" ? "Loading…" : "Load more"}
            </Button>
          )}
        </>
      )}

      <AddBookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folderId={folderId}
      />
    </div>
  );
}
