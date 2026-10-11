import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

import type { ExtractionTemplate } from "@/api/extraction-templates/types";
import type { Column } from "@/components/data-table";

type ColumnActions = {
  status: "active" | "deleted";
  onEdit: (template: ExtractionTemplate) => void;
  onDelete: (template: ExtractionTemplate) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (template: ExtractionTemplate) => void;
  deletePending: boolean;
  permanentDeletePending: boolean;
};

export function getTemplateColumns({
  status,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  deletePending,
  permanentDeletePending,
}: ColumnActions): Column<ExtractionTemplate>[] {
  return [
    {
      header: "Name",
      accessor: (template) => (
        <div>
          <div className="font-medium">{template.name}</div>
          <div className="max-w-sm truncate text-xs text-muted-foreground">
            {template.description || "No description"}
          </div>
        </div>
      ),
    },
    {
      header: "Model",
      accessor: (template) =>
        template.defaultModel ? (
          <Badge variant="secondary">{template.defaultModel}</Badge>
        ) : (
          <span className="text-muted-foreground">Default</span>
        ),
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
    },
    {
      header: "Updated",
      accessor: (template) => (
        <span className="text-muted-foreground">
          {new Date(template.updatedAt).toLocaleDateString()}
        </span>
      ),
      headClassName: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
    },
    {
      header: "",
      accessor: (template) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
            {status === "active" ? "Edit" : "View"}
          </Button>
          {status === "active" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(template)}
              disabled={deletePending}
            >
              Delete
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(template.id)}
              >
                Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onPermanentDelete(template)}
                disabled={permanentDeletePending}
              >
                Delete permanently
              </Button>
            </>
          )}
        </div>
      ),
      cellClassName: "text-right",
    },
  ];
}
