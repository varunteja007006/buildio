"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { BookCard } from "@/components/books/book-card";

/** Lists favorite books in the same grid as the bookshelf. */
export function FavouritesBookshelf() {
  const favorites = useQuery(api.books.listFavorites, {});
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Favourites</h1>
        <p className="text-sm text-muted-foreground">Your favorite books.</p>
      </div>

      {favorites === undefined ? (
        <p className="text-sm text-muted-foreground">Loading favourites…</p>
      ) : favorites.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No favourite books yet. Use the heart on a book card to add it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              createdAt={book.createdAt}
              isFavorite={book.isFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
