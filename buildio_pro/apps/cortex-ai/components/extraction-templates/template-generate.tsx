"use client";

import { Button } from "@workspace/ui/components/button";
import { FileText, Loader2, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";

import { useGenerateTemplateSuggestion } from "@/api/extraction-templates/query";
import type { TemplateSuggestion } from "@/api/extraction-templates/types";

const ACCEPT =
  ".pdf,.md,.mdx,.txt,.csv,application/pdf,text/plain,text/markdown";
const MAX_BYTES = 10 * 1024 * 1024;

type TemplateGenerateProps = {
  /** True while the template is being saved. */
  disabled: boolean;
  onGenerated: (suggestion: TemplateSuggestion) => void;
};

/**
 * "Draft with AI" panel: the user drops one sample document and the model
 * proposes a name, description, instructions and output schema for the
 * template. The upload is used for the draft only — it is never stored.
 *
 * Mounted inside the template dialog, so it unmounts (and resets) on close.
 */
export function TemplateGenerate({
  disabled,
  onGenerated,
}: TemplateGenerateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = useGenerateTemplateSuggestion();
  const pending = generate.isPending;

  const pick = (next: File | null) => {
    if (next && next.size > MAX_BYTES) {
      setError("Choose a document smaller than 10 MB.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  };

  const clear = () => {
    pick(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    try {
      onGenerated(await generate.mutateAsync(file));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to generate a template suggestion.",
      );
    }
  };

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-muted-foreground" />
        Draft with AI
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Upload a sample document and Cortex fills in the name, description,
        instructions and output schema. The file is used for the draft only and
        is never saved.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || disabled}
          onClick={() => inputRef.current?.click()}
        >
          <FileText data-icon="inline-start" />
          {file ? "Replace document" : "Choose document"}
        </Button>
        {file && (
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="max-w-40 truncate">{file.name}</span>
            <button
              type="button"
              aria-label="Remove document"
              className="rounded hover:text-foreground"
              disabled={pending}
              onClick={clear}
            >
              <X className="size-3.5" />
            </button>
          </span>
        )}
        <Button
          type="button"
          size="sm"
          className="ml-auto"
          disabled={!file || pending || disabled}
          onClick={run}
        >
          {pending ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {pending ? "Generating..." : "Generate"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
