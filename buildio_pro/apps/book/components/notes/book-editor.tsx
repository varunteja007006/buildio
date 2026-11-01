"use client";

import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import * as React from "react";

type BookEditorProps = {
  /** The saved BlockNote document for this book. */
  doc: PartialBlock[];
  onChange: (doc: PartialBlock[]) => void;
};

const SAVE_DELAY_MS = 500;

export function BookEditor({ doc, onChange }: BookEditorProps) {
  const editor = useCreateBlockNote({ initialContent: doc });

  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // The parent re-creates this component (via React key) when switching books,
  // so flush a pending debounced save instead of losing the last keystrokes.
  React.useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        onChangeRef.current(editor.document);
      }
    },
    [editor],
  );

  function handleChange() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // `editor.document` is read lazily inside the timer, so it captures the
    // latest content without re-binding the callback on every change.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onChangeRef.current(editor.document);
    }, SAVE_DELAY_MS);
  }

  return (
    <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
  );
}
