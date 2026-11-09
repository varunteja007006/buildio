"use client";

import type { PartialBlock } from "@blocknote/core";
import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useMutation, useQuery } from "convex/react";
import { DownloadIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteBookDialog } from "@/components/books/delete-book-dialog";
import { BookEditor } from "@/components/notes/book-editor";
import {
  blocksToMarkdown,
  downloadBookNotes,
  type BookNotes,
} from "@/components/notes/notes-model";
import { getConvexErrorMessage } from "@/lib/convex-error";

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "saving" | "saved";

/** Parses a stored JSON document; a missing, empty, or broken doc is blank. */
function parseDoc(raw: string | null | undefined): PartialBlock[] {
  try {
    const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as PartialBlock[];
    }
  } catch {
    // Fall through to a blank document below.
  }
  // BlockNote rejects empty `initialContent`, so an unsaved or broken doc
  // still needs at least one block.
  return [{ type: "paragraph" }];
}

export function BooksEditor({ bookId }: { bookId: Id<"books"> }) {
  const book = useQuery(api.books.get, { id: bookId });
  const updateBook = useMutation(api.books.update);
  const router = useRouter();

  const [titleDraft, setTitleDraft] = React.useState<string | null>(null);
  const [renameError, setRenameError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const latestTitle = React.useRef<string | null>(null);
  const latestDoc = React.useRef<PartialBlock[] | null>(null);
  const titleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const docTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutateRef = React.useRef(updateBook);

  const initialDoc = React.useMemo(() => parseDoc(book?.doc), [book?.doc]);

  // Navigating away (or deleting the book) must not lose the last edits,
  // so pending debounced changes are flushed directly here.
  React.useEffect(
    () => () => {
      if (titleTimer.current !== null) {
        clearTimeout(titleTimer.current);
      }
      if (docTimer.current !== null) {
        clearTimeout(docTimer.current);
      }
      if (latestTitle.current !== null) {
        void mutateRef
          .current({ id: bookId, title: latestTitle.current })
          .catch(() => {});
      }
      if (latestDoc.current !== null) {
        void mutateRef
          .current({ id: bookId, doc: JSON.stringify(latestDoc.current) })
          .catch(() => {});
      }
    },
    [bookId],
  );

  async function renameNow() {
    const nextTitle = latestTitle.current;
    latestTitle.current = null;
    if (book === undefined || nextTitle === null || nextTitle === book.title) {
      return;
    }
    try {
      await updateBook({ id: book.id, title: nextTitle });
      setRenameError(null);
    } catch (cause) {
      setRenameError(getConvexErrorMessage(cause));
    }
  }

  function handleTitleChange(value: string) {
    setTitleDraft(value);
    latestTitle.current = value;
    if (titleTimer.current !== null) {
      clearTimeout(titleTimer.current);
    }
    titleTimer.current = setTimeout(() => {
      titleTimer.current = null;
      void renameNow();
    }, AUTOSAVE_DELAY_MS);
  }

  async function saveDoc() {
    const doc = latestDoc.current;
    latestDoc.current = null;
    if (book === undefined || doc === null) {
      return;
    }
    setSaveStatus("saving");
    try {
      await updateBook({ id: book.id, doc: JSON.stringify(doc) });
      setSaveError(null);
      setSaveStatus("saved");
    } catch (cause) {
      setSaveError(getConvexErrorMessage(cause));
      setSaveStatus("idle");
    }
  }

  function handleDocChange(doc: PartialBlock[]) {
    latestDoc.current = doc;
    setSaveStatus("saving");
    if (docTimer.current !== null) {
      clearTimeout(docTimer.current);
    }
    docTimer.current = setTimeout(() => {
      docTimer.current = null;
      void saveDoc();
    }, AUTOSAVE_DELAY_MS);
  }

  function exportAs(extension: "md" | "mdx") {
    if (!book) {
      return;
    }
    const doc = latestDoc.current ?? initialDoc;
    const bookNotes: BookNotes = {
      id: book.id,
      title: titleDraft ?? book.title,
      doc,
    };
    downloadBookNotes(bookNotes, blocksToMarkdown(doc), extension);
  }

  if (book === undefined) {
    return <p className="text-sm text-muted-foreground">Loading book…</p>;
  }

  const saving =
    saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={titleDraft ?? book.title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Book title"
          aria-label="Book title"
          className="max-w-sm text-lg font-semibold"
        />
        {renameError === null && saveError === null ? (
          <span className="text-sm text-muted-foreground">{saving}</span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => exportAs("md")}>
            <DownloadIcon />
            .md
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => exportAs("mdx")}
          >
            <DownloadIcon />
            .mdx
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-label="Delete book"
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon />
          </Button>
        </div>
      </div>
      {renameError !== null ? (
        <p className="text-sm text-destructive">{renameError}</p>
      ) : null}
      {saveError !== null ? (
        <p className="text-sm text-destructive">{saveError}</p>
      ) : null}
      <div className="rounded-xl border bg-card p-4">
        <div className="mx-auto max-w-3xl">
          <BookEditor
            key={book.id}
            doc={initialDoc}
            onChange={handleDocChange}
          />
        </div>
      </div>
      <DeleteBookDialog
        book={confirmDelete ? { id: book.id, title: book.title } : null}
        onOpenChange={setConfirmDelete}
        onDeleted={() => router.push("/home/notes")}
      />
    </div>
  );
}
