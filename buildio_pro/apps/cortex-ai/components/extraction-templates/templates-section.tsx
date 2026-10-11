"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

import { useChatModels } from "@/api/chat/query";
import {
  useCreateExtractionTemplate,
  useDeleteExtractionTemplate,
  useExtractionTemplates,
  usePermanentlyDeleteExtractionTemplate,
  useRestoreExtractionTemplate,
  useUpdateExtractionTemplate,
} from "@/api/extraction-templates/query";
import type {
  ExtractionTemplate,
  TemplateInput,
  TemplateSuggestion,
} from "@/api/extraction-templates/types";
import { DataTable } from "@/components/data-table";
import { DeleteDialog } from "@/components/documents/delete-dialog";
import { getTemplateColumns } from "@/components/extraction-templates/template-columns";
import {
  emptyForm,
  TemplateDialog,
  toForm,
  type FormState,
} from "@/components/extraction-templates/template-dialog";

const PAGE_SIZE = 10;

type ConfirmAction =
  | { kind: "delete"; template: ExtractionTemplate }
  | { kind: "permanent"; template: ExtractionTemplate };

export function ExtractionTemplatesSection() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"active" | "deleted">("active");
  const [editing, setEditing] = useState<ExtractionTemplate | null | undefined>(
    undefined,
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const { data, isLoading } = useExtractionTemplates(page, PAGE_SIZE, status);
  const { data: modelsData, isLoading: modelsLoading } = useChatModels();
  const create = useCreateExtractionTemplate();
  const update = useUpdateExtractionTemplate();
  const remove = useDeleteExtractionTemplate();
  const restore = useRestoreExtractionTemplate();
  const permanent = usePermanentlyDeleteExtractionTemplate();
  const templates = data?.templates ?? [];
  const pageCount = data?.pageCount || 1;

  const openCreate = () => {
    setError(null);
    setForm(emptyForm);
    setEditing(null);
  };
  const openEdit = (template: ExtractionTemplate) => {
    setError(null);
    setForm(toForm(template));
    setEditing(template);
  };
  const closeDialog = () => {
    if (!create.isPending && !update.isPending) setEditing(undefined);
  };
  const setField = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const applySuggestion = (suggestion: TemplateSuggestion) => {
    setError(null);
    setForm((current) => ({
      ...current,
      name: suggestion.name,
      description: suggestion.description,
      instructions: suggestion.instructions,
      outputSchema: suggestion.outputSchema
        ? JSON.stringify(suggestion.outputSchema, null, 2)
        : "",
    }));
  };
  const save = async () => {
    let outputSchema: unknown = null;
    if (form.outputSchema.trim()) {
      try {
        outputSchema = JSON.parse(form.outputSchema);
      } catch {
        setError("Output schema must be valid JSON.");
        return;
      }
    }
    const input: TemplateInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      outputSchema,
      defaultModel: form.defaultModel.trim(),
    };
    if (!input.name || !input.instructions) {
      setError("Name and instructions are required.");
      return;
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input });
      else await create.mutateAsync(input);
      setEditing(undefined);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save template.",
      );
    }
  };

  const columns = getTemplateColumns({
    status,
    onEdit: openEdit,
    onDelete: (template) =>
      setConfirm({ kind: "delete", template }),
    onRestore: (id) => restore.mutate(id),
    onPermanentDelete: (template) =>
      setConfirm({ kind: "permanent", template }),
    deletePending: remove.isPending,
    permanentDeletePending: permanent.isPending,
  });

  const confirmDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "delete") await remove.mutateAsync(confirm.template.id);
      else await permanent.mutateAsync(confirm.template.id);
      setConfirm(null);
    } catch {
      // Error surfaced by mutation state; keep dialog open for retry.
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={openCreate} disabled={status === "deleted"}>
          <Plus data-icon="inline-start" /> New template
        </Button>
        <div className="flex gap-2">
          <Button
            variant={status === "active" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStatus("active");
              setPage(1);
            }}
          >
            Active
          </Button>
          <Button
            variant={status === "deleted" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStatus("deleted");
              setPage(1);
            }}
          >
            Deleted
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={templates}
        keyExtractor={(template) => template.id}
        loading={isLoading}
        emptyMessage={
          status === "active"
            ? "No extraction templates yet."
            : "Trash is empty."
        }
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-muted-foreground">
          {data?.total
            ? `Page ${page} of ${pageCount} · ${data.total} total`
            : "0 results"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft data-icon="inline-start" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Next <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <TemplateDialog
        template={editing}
        form={form}
        error={error}
        pending={create.isPending || update.isPending}
        models={modelsData?.models ?? []}
        modelsLoading={modelsLoading}
        onChange={setField}
        onGenerated={applySuggestion}
        onSave={save}
        onClose={closeDialog}
      />
      <DeleteDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={
          confirm?.kind === "permanent"
            ? "Delete template permanently?"
            : "Move template to trash?"
        }
        description={
          confirm?.kind === "permanent"
            ? `This permanently deletes "${confirm.template.name}". This cannot be undone.`
            : confirm
              ? `"${confirm.template.name}" moves to trash and can be restored from the Deleted tab.`
              : ""
        }
        isPending={
          confirm?.kind === "permanent"
            ? permanent.isPending
            : remove.isPending
        }
        onConfirm={confirmDelete}
      />
    </>
  );
}
