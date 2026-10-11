"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useDocuments } from "@/api/documents/query";
import {
  useEmptyTrash,
  usePermanentlyDeleteDocument,
  useRestoreDocument,
} from "@/api/documents/query";
import type { Document } from "@/api/documents/types";
import {
  usePermanentlyDeleteExtractionTemplate,
  useRestoreExtractionTemplate,
} from "@/api/extraction-templates/query";
import type { ExtractionTemplate } from "@/api/extraction-templates/types";
import { DataTable } from "@/components/data-table";
import { DeleteDialog } from "@/components/documents/delete-dialog";
import { getTrashDocumentColumns } from "@/components/documents/trash/trash-columns";
import { TrashTemplatesSection } from "@/components/documents/trash/trash-templates-section";
import { PageHeader } from "@/components/page-header";

const PAGE_SIZE = 10;

type ConfirmAction =
  | { kind: "doc-permanent"; doc: Document }
  | { kind: "template-permanent"; template: ExtractionTemplate }
  | { kind: "empty" };

/**
 * Trash page (H7/H8): deleted documents + extraction templates with
 * restore, permanent delete, and empty-trash affordances.
 */
export function DocumentsTrashPage() {
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const { data, isLoading } = useDocuments({
    status: "deleted",
    page,
    pageSize: PAGE_SIZE,
  });
  const restoreDoc = useRestoreDocument();
  const permanentDoc = usePermanentlyDeleteDocument();
  const emptyTrash = useEmptyTrash();
  const restoreTemplate = useRestoreExtractionTemplate();
  const permanentTemplate = usePermanentlyDeleteExtractionTemplate();

  const docs = data?.documents ?? [];
  const pageCount = data?.pageCount || 1;

  const handleRestoreDoc = (id: string) => restoreDoc.mutate(id);
  const handleRestoreTemplate = (id: string) => restoreTemplate.mutate(id);

  const confirmPermanentDoc = async () => {
    if (confirm?.kind !== "doc-permanent") return;
    try {
      await permanentDoc.mutateAsync(confirm.doc.id);
      setConfirm(null);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to delete document.",
      );
    }
  };
  const confirmPermanentTemplate = async () => {
    if (confirm?.kind !== "template-permanent") return;
    try {
      await permanentTemplate.mutateAsync(confirm.template.id);
      setConfirm(null);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to delete template.",
      );
    }
  };
  const confirmEmpty = async () => {
    if (confirm?.kind !== "empty") return;
    try {
      const result = await emptyTrash.mutateAsync();
      toast.success(`Permanently deleted ${result.deleted} documents`);
      setConfirm(null);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to empty trash.",
      );
    }
  };
  const handleConfirm = () => {
    if (confirm?.kind === "doc-permanent") void confirmPermanentDoc();
    else if (confirm?.kind === "template-permanent")
      void confirmPermanentTemplate();
    else void confirmEmpty();
  };

  const columns = getTrashDocumentColumns({
    onRestore: handleRestoreDoc,
    onPermanentDelete: (doc) => setConfirm({ kind: "doc-permanent", doc }),
    restorePending: restoreDoc.isPending,
    permanentPending: permanentDoc.isPending,
  });

  const confirmCopy = (() => {
    if (confirm?.kind === "doc-permanent")
      return `This permanently deletes "${confirm.doc.filename}" and its extractions, chunks, and embeddings. This cannot be undone.`;
    if (confirm?.kind === "template-permanent")
      return `This permanently deletes "${confirm.template.name}". This cannot be undone.`;
    return "This permanently deletes every trashed document, including their extractions, chunks, and embeddings. This cannot be undone.";
  })();

  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents", href: "/dashboard/documents" },
          { label: "Trash" },
        ]}
        title="Trash"
        description="Restoring a document also restores the extractions and chunks trashed with it."
        actions={
          <Button
            variant="destructive"
            onClick={() => setConfirm({ kind: "empty" })}
            disabled={emptyTrash.isPending || docs.length === 0}
          >
            Empty trash
          </Button>
        }
      />
      <div className="flex w-full flex-1 flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Documents</h2>
          <DataTable
            columns={columns}
            data={docs}
            keyExtractor={(doc) => doc.id}
            loading={isLoading}
            emptyMessage="Trash is empty."
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
        </section>

        <TrashTemplatesSection
          onConfirmDelete={(template) =>
            setConfirm({ kind: "template-permanent", template })
          }
          onConfirmRestore={handleRestoreTemplate}
        />
      </div>

      <DeleteDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={
          confirm?.kind === "empty"
            ? "Empty trash?"
            : confirm?.kind === "template-permanent"
              ? "Delete template permanently?"
              : "Delete document permanently?"
        }
        description={confirmCopy}
        isPending={
          permanentDoc.isPending ||
          permanentTemplate.isPending ||
          emptyTrash.isPending
        }
        onConfirm={handleConfirm}
      />
    </>
  );
}
