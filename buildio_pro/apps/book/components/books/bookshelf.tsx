"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { usePaginatedQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import * as React from "react";

import { AddBookDialog } from "@/components/books/add-book-dialog";
import { BookCard } from "@/components/books/book-card";

const PAGE_SIZE = 12;

export function Bookshelf() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.books.list,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const loaded = status !== "LoadingFirstPage";
  const isDone = status === "Exhausted";
  const countLabel = !loaded
    ? null
    : isDone
      ? `${results.length} ${results.length === 1 ? "book" : "books"}`
      : `${results.length}+ books`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
          <p className="text-sm text-muted-foreground">
            Block-style books stored in Convex, sync across devices.
            {countLabel === null ? "" : ` (${countLabel})`}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon />
          Add book
        </Button>
      </div>

      {!loaded ? (
        <p className="text-sm text-muted-foreground">Loading books…</p>
      ) : results.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No books yet. Add your first book to start writing.
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

      <AddBookDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
