import path from "node:path";

import type { FilePart, TextPart } from "ai";

import { getDocumentObject } from "@/lib/storage/s3";

/** File extensions extracted inline as plain text. */
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".mdx", ".csv"]);
const MULTIMODAL_MEDIA_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export class UnsupportedFileError extends Error {
  constructor(extension: string) {
    super(
      `Unsupported file format: ${extension}. Supported: PDF, PNG, JPEG, WebP, GIF, Markdown, text and CSV.`,
    );
    this.name = "UnsupportedFileError";
  }
}

export type DocumentFile = {
  bytes: Uint8Array;
  extension: string;
  isPdf: boolean;
  /** PDFs and images are sent to the model as multimodal file parts. */
  mediaType: string | null;
};

/** Load legacy remote URLs or current MinIO object keys. */
export async function fetchDocumentFile(filepath: string): Promise<Uint8Array> {
  return getDocumentObject(filepath);
}

/** Classify raw bytes by extension; throws for formats extraction can't read. */
export function classifyDocumentFile(
  filename: string,
  bytes: Uint8Array,
): DocumentFile {
  const extension = path.extname(filename).toLowerCase();
  const mediaType = MULTIMODAL_MEDIA_TYPES[extension] ?? null;
  if (!mediaType && !TEXT_EXTENSIONS.has(extension)) {
    throw new UnsupportedFileError(extension);
  }
  return { bytes, extension, isPdf: extension === ".pdf", mediaType };
}

/** Load a document's file and classify it for extraction. */
export async function loadDocumentFile(
  filename: string,
  filepath: string,
): Promise<DocumentFile> {
  return classifyDocumentFile(filename, await fetchDocumentFile(filepath));
}

/**
 * Build model content parts: PDFs and images are multimodal; text is inlined.
 */
export function buildDocumentParts(
  file: DocumentFile,
): (TextPart | FilePart)[] {
  if (file.mediaType) {
    return [
      {
        type: "file",
        data: file.bytes,
        mediaType: file.mediaType,
      },
    ];
  }
  const text = new TextDecoder().decode(file.bytes);
  return [{ type: "text", text }];
}
