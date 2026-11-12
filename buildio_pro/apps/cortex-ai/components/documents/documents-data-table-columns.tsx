"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { FileText } from "lucide-react";

import { formatDate, truncateHash } from "@/api/documents/helpers";
import type { Document } from "@/api/documents/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DocumentRowActions } from "@/components/documents/document-delete-button";
import { DocumentExtractionBadge } from "@/components/documents/document-extraction-badge";
import { DocumentIngestErrorBadge } from "@/components/documents/document-ingest-error-badge";

export const documentsColumns: ColumnDef<Document>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all documents"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.filename}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "filename",
    accessorKey: "filename",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Filename" />
    ),
    enableSorting: true,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{row.original.filename}</span>
        </div>
      );
    },
  },
  {
    id: "filepath",
    accessorKey: "filepath",
    header: "Path",
    enableSorting: true,
    cell: ({ row }) => (
      <span
        className="block max-w-64 truncate text-muted-foreground"
        title={row.original.filepath}
      >
        {row.original.filepath}
      </span>
    ),
  },
  {
    id: "fileHash",
    accessorKey: "fileHash",
    header: "Hash",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {truncateHash(row.original.fileHash)}
      </span>
    ),
  },
  {
    id: "ingested",
    accessorKey: "ingested",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const doc = row.original;
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={doc.ingested ? "default" : "secondary"}>
            {doc.ingested ? "Ingested" : "Pending"}
          </Badge>
          {!doc.ingested && doc.lastIngestError && (
            <DocumentIngestErrorBadge
              documentId={doc.id}
              filename={doc.filename}
              error={doc.lastIngestError}
            />
          )}
          <DocumentExtractionBadge documentId={row.original.id} />
        </div>
      );
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end gap-0.5">
        <DocumentRowActions document={row.original} />
      </div>
    ),
  },
];
