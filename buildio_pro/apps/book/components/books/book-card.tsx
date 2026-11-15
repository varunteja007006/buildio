"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useMutation } from "convex/react";
import { HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";

function formatDate(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookCard({
  id,
  title,
  createdAt,
  isFavorite,
}: {
  id: Id<"books">;
  title: string;
  createdAt: number;
  isFavorite: boolean;
}) {
  const router = useRouter();
  const setFavorite = useMutation(api.books.setFavorite);
  const open = () => router.push(`/home/notes/${id}`);
  const toggleFavorite = () => {
    void setFavorite({ id, favorite: !isFavorite }).catch((error) => {
      console.error("Failed to update book favorite", error);
    });
  };
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className="relative cursor-pointer transition-colors hover:bg-accent focus-visible:outline-2"
    >
      <button
        type="button"
        aria-label={`${isFavorite ? "Unfavorite" : "Favorite"} book ${title}`}
        className={`absolute top-3 right-3 z-10 rounded-sm p-0.5 opacity-60 transition-colors hover:opacity-100 focus-visible:outline-visible ${
          isFavorite
            ? "text-amber-500"
            : "text-muted-foreground hover:text-amber-500"
        }`}
        onClick={(event) => {
          // Keep this click from opening the book.
          event.stopPropagation();
          toggleFavorite();
        }}
        onKeyDown={(event) => {
          // Keep Enter/Space from also opening the book.
          event.stopPropagation();
        }}
      >
        <HeartIcon className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
      </button>
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription>Created {formatDate(createdAt)}</CardDescription>
      </CardHeader>
    </Card>
  );
}
