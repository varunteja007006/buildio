"use client";

import { BlockNoteEditor, type PartialBlock } from "@blocknote/core";

export const STORAGE_KEY = "book-notes:v2";

const LEGACY_STORAGE_KEY = "book-notes:v1";

export type BookNotes = {
  id: string;
  title: string;
  /** BlockNote document stored as plain JSON (PartialBlock[]-compatible). */
  doc: PartialBlock[];
};

export type NotesStore = {
  books: BookNotes[];
  activeId: string | null;
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function emptyBook(title: string): BookNotes {
  return { id: newId(), title, doc: [{ type: "paragraph" }] };
}

export function emptyStore(): NotesStore {
  return { books: [], activeId: null };
}

function loadLegacyStore(raw: string): NotesStore {
  // Convert v1 { blocks: Block[] } into a v2 BlockNote document. v1 is left
  // untouched so the migration can be adjusted or retried later.
  try {
    const parsed = JSON.parse(raw) as {
      books?: unknown;
      activeId?: unknown;
    };
    const legacyBooks = Array.isArray(parsed.books) ? parsed.books : [];
    const books: BookNotes[] = legacyBooks.map((item) => {
      const book = (item ?? {}) as {
        id?: unknown;
        title?: unknown;
        blocks?: unknown;
      };
      return {
        id: typeof book.id === "string" ? book.id : newId(),
        title: typeof book.title === "string" ? book.title : "Untitled",
        doc: convertLegacyBlocks(Array.isArray(book.blocks) ? book.blocks : []),
      };
    });
    const activeId =
      typeof parsed.activeId === "string" &&
      books.some((book) => book.id === parsed.activeId)
        ? parsed.activeId
        : (books[0]?.id ?? null);
    return { books, activeId };
  } catch {
    return emptyStore();
  }
}

function legacyText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function convertLegacyBlocks(legacy: unknown[]): PartialBlock[] {
  const blocks: PartialBlock[] = [];

  const pushParagraph = (lines: string[]) => {
    for (const line of lines) {
      blocks.push(
        line.trim() ? { type: "paragraph", content: line } : { type: "paragraph" },
      );
    }
  };

  for (const item of legacy) {
    const block = (item ?? {}) as {
      type?: unknown;
      text?: unknown;
      done?: unknown;
    };
    const text = legacyText(block.text);
    switch (block.type) {
      case "heading": {
        const [first, ...rest] = text.split("\n");
        if (first?.trim()) {
          blocks.push({ type: "heading", props: { level: 2 }, content: first });
        }
        pushParagraph(rest);
        break;
      }
      case "paragraph": {
        if (text.trim()) {
          pushParagraph(text.split("\n"));
        } else {
          blocks.push({ type: "paragraph" });
        }
        break;
      }
      case "quote": {
        for (const line of text.split("\n")) {
          if (line.trim()) {
            blocks.push({ type: "quote", content: line });
          }
        }
        break;
      }
      case "todo": {
        blocks.push({
          type: "checkListItem",
          props: { checked: block.done === true },
          ...(text.trim() ? { content: text } : {}),
        });
        break;
      }
      case "list": {
        for (const line of text.split("\n")) {
          if (line.trim()) {
            blocks.push({ type: "bulletListItem", content: line });
          }
        }
        break;
      }
    }
  }
  return blocks.length > 0 ? blocks : [{ type: "paragraph" }];
}

function parseStore(raw: string): NotesStore | null {
  try {
    const parsed = JSON.parse(raw) as Partial<NotesStore>;
    if (!Array.isArray(parsed.books)) {
      return null;
    }
    const books = parsed.books
      .filter(
        (book): book is BookNotes =>
          !!book &&
          typeof book.id === "string" &&
          typeof book.title === "string" &&
          Array.isArray(book.doc),
      )
      .map((book) => ({
        ...book,
        doc:
          book.doc.length > 0
            ? book.doc
            : ([{ type: "paragraph" }] as PartialBlock[]),
      }));
    if (books.length === 0) {
      return emptyStore();
    }
    return {
      books,
      activeId:
        parsed.activeId && books.some((book) => book.id === parsed.activeId)
          ? parsed.activeId
          : (books[0]?.id ?? null),
    };
  } catch {
    return null;
  }
}

export function loadStore(): NotesStore {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return parseStore(raw) ?? emptyStore();
    }
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = loadLegacyStore(legacy);
      saveStore(migrated);
      return migrated;
    }
    return emptyStore();
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: NotesStore): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable (quota/private mode); keep the session in-memory only.
  }
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "book-notes";
}

let exportEditor: BlockNoteEditor | null = null;

/**
 * Converts a saved BlockNote document to Markdown using a headless editor, so
 * export also works without the editor being mounted.
 */
export function blocksToMarkdown(blocks: PartialBlock[]): string {
  exportEditor ??= BlockNoteEditor.create();
  return exportEditor.blocksToMarkdownLossy(blocks);
}

export function downloadBookNotes(
  book: BookNotes,
  markdown: string,
  extension: "md" | "mdx",
): void {
  const content = `# ${book.title}\n\n${markdown.trimEnd()}\n`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(book.title)}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
