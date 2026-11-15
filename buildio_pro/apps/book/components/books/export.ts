"use client";

import { BlockNoteEditor, type PartialBlock } from "@blocknote/core";

export type BookNotes = {
  id: string;
  title: string;
  /** BlockNote document stored as plain JSON (PartialBlock[]-compatible). */
  doc: PartialBlock[];
};

function slugify(title: string): string {
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
