import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import { use } from "react";

import { BookDetail } from "@/components/books/book-detail";
import { TopicProvider } from "@/components/topic-provider";

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  return (
    <TopicProvider>
      <BookDetail bookId={bookId as Id<"books">} />
    </TopicProvider>
  );
}
