"use client";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUpdateSchemaTableContext } from "@/api/connections/query";
import type { SchemaTableDetail } from "@/api/connections/types";

const MAX_LENGTH = 8000;

/**
 * Editable explanation for one table. Saving is revision-checked: a conflict
 * returns 409 instead of overwriting another user's edit.
 */
export function TableExplanationEditor({
  connectionId,
  tableId,
  context,
  onDirtyChange,
}: {
  connectionId: string;
  tableId: string;
  context: SchemaTableDetail["context"];
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const saved = context?.explanation ?? "";
  const [draft, setDraft] = useState(saved);
  const mutation = useUpdateSchemaTableContext(connectionId);
  const dirty = draft !== saved;

  useEffect(() => setDraft(saved), [tableId, saved]);
  useEffect(() => {
    onDirtyChange?.(dirty);
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      onDirtyChange?.(false);
    };
  }, [dirty, onDirtyChange]);

  const save = () => {
    mutation.mutate(
      {
        tableId,
        input: { explanation: draft, expectedRevision: context?.revision ?? 0 },
      },
      {
        onSuccess: () => toast.success("Table explanation saved"),
        onError: (error) => {
          const code = (
            error as { response?: { data?: { code?: string } } }
          )?.response?.data?.code;
          if (code === "revision_conflict") {
            toast.error(
              "Changed elsewhere since you opened this editor. Latest text loaded — review and save again.",
            );
            setDraft(saved);
          } else {
            toast.error(
              error instanceof Error ? error.message : "Unable to save",
            );
          }
        },
      },
    );
  };

  return (
    <section className="space-y-2" aria-label="Table explanation">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium">Explanation</h4>
        <span
          className={`text-xs ${dirty ? "text-amber-600" : "text-muted-foreground"}`}
        >
          {draft.length}/{MAX_LENGTH}
          {dirty ? " · unsaved" : ""}
        </span>
      </div>
      <Textarea
        value={draft}
        maxLength={MAX_LENGTH}
        rows={4}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Describe what this table contains and how an agent should use it."
        aria-label="Table explanation"
      />
      <p className="text-xs text-muted-foreground">
        Saved in this app only. The source database is never modified.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!dirty || mutation.isPending}
          onClick={save}
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save />
          )}
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!dirty || mutation.isPending}
          onClick={() => setDraft(saved)}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}
