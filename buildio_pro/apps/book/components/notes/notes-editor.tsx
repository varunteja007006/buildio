"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { DownloadIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { BookEditor } from "@/components/notes/book-editor";
import {
  blocksToMarkdown,
  downloadBookNotes,
  emptyBook,
  loadStore,
  saveStore,
  type BookNotes,
  type NotesStore,
} from "@/components/notes/notes-model";

export function NotesEditor() {
  const [store, setStore] = React.useState<NotesStore | null>(null);
  const [newTitle, setNewTitle] = React.useState("");

  React.useEffect(() => {
    setStore(loadStore());
  }, []);

  const active = React.useMemo(
    () => store?.books.find((book) => book.id === store.activeId) ?? null,
    [store],
  );

  function updateStore(next: NotesStore) {
    setStore(next);
    saveStore(next);
  }

  function updateBook(bookId: string, update: (book: BookNotes) => BookNotes) {
    if (!store) {
      return;
    }
    updateStore({
      ...store,
      books: store.books.map((book) =>
        book.id === bookId ? update(book) : book,
      ),
    });
  }

  function createBook() {
    const title = newTitle.trim();
    if (!title || !store) {
      return;
    }
    const book = emptyBook(title);
    setNewTitle("");
    updateStore({ books: [...store.books, book], activeId: book.id });
  }

  function exportActive(extension: "md" | "mdx") {
    if (!active) {
      return;
    }
    const markdown = blocksToMarkdown(active.doc);
    downloadBookNotes(active, markdown, extension);
  }

  if (!store) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading notes…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={store.activeId ?? ""}
          onValueChange={(activeId) => updateStore({ ...store, activeId })}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a book" />
          </SelectTrigger>
          <SelectContent>
            {store.books.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              createBook();
            }
          }}
          placeholder="New book title"
          className="w-56"
        />
        <Button
          type="button"
          variant="outline"
          onClick={createBook}
          disabled={!newTitle.trim()}
        >
          <PlusIcon />
          Add book
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!active}
            onClick={() => exportActive("md")}
          >
            <DownloadIcon />
            .md
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!active}
            onClick={() => exportActive("mdx")}
          >
            <DownloadIcon />
            .mdx
          </Button>
        </div>
      </div>

      {active ? (
        <>
          <Input
            value={active.title}
            onChange={(event) =>
              updateBook(active.id, (book) => ({
                ...book,
                title: event.target.value,
              }))
            }
            placeholder="Book title"
            aria-label="Book title"
          />
          <div className="rounded-xl border bg-card p-4">
            <div className="mx-auto max-w-3xl">
              <BookEditor
                key={active.id}
                doc={active.doc}
                onChange={(doc) =>
                  updateBook(active.id, (book) => ({ ...book, doc }))
                }
              />
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No book selected. Add a book above to start taking notes.
        </p>
      )}
    </div>
  );
}
