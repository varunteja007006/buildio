import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import { use } from "react";

import { BookDetail } from "@/components/books/book-detail";

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  return <BookDetail bookId={bookId as Id<"books">} />;
}
