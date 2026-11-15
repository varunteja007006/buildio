"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { useMutation, useQuery } from "convex/react";
import { HeartIcon } from "lucide-react";
import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { BooksEditor } from "@/components/books/books-editor";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Detail page scaffold for one book; the breadcrumb title comes from the
 * same cached query the editor renders with.
 */
export function BookDetail({ bookId }: { bookId: Id<"books"> }) {
  const book = useQuery(api.books.get, { id: bookId });
  const setFavorite = useMutation(api.books.setFavorite);
  const isFavorite = book?.isFavorite ?? false;
  const toggleFavorite = () => {
    void setFavorite({ id: bookId, favorite: !isFavorite }).catch((error) => {
      console.error("Failed to update book favorite", error);
    });
  };
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/home">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/home/notes">Notes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{book?.title ?? "Book"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`${isFavorite ? "Unfavorite" : "Favorite"} book`}
              title={`${isFavorite ? "Unfavorite" : "Favorite"} book`}
              disabled={book === undefined}
              onClick={toggleFavorite}
            >
              <HeartIcon
                className={`size-4 ${
                  isFavorite ? "fill-current text-amber-500" : ""
                }`}
                aria-hidden="true"
              />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <BooksEditor bookId={bookId} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
