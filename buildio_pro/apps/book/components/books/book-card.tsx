"use client";

import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
}: {
  id: Id<"books">;
  title: string;
  createdAt: number;
}) {
  const router = useRouter();
  const open = () => router.push(`/home/notes/${id}`);
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
      className="cursor-pointer transition-colors hover:bg-accent focus-visible:outline-2"
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription>Created {formatDate(createdAt)}</CardDescription>
      </CardHeader>
    </Card>
  );
}
