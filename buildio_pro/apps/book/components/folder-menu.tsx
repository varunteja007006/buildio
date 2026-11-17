"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { SidebarMenuAction } from "@workspace/ui/components/sidebar";
import { useMutation } from "convex/react";
import {
  MoreHorizontalIcon,
  NotebookPenIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { MAX_FOLDER_DEPTH, type FolderId, type FolderNode } from "@/lib/folders";

export type DialogState =
  | { kind: "create"; parentId: FolderId | null; parentDepth: number }
  | { kind: "create-note"; folderId: FolderId }
  | { kind: "rename"; id: FolderId; name: string }
  | { kind: "delete"; id: FolderId; name: string; hasChildren: boolean };

/** Per-folder actions menu (favorite / new subfolder / rename / delete). */
export function FolderMenu({
  node,
  onOpenDialog,
}: {
  node: FolderNode;
  onOpenDialog: (dialog: DialogState) => void;
}) {
  const atMaxDepth = node.depth >= MAX_FOLDER_DEPTH;
  const setFavorite = useMutation(api.bookFolders.setFavorite);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction
          aria-label={`Folder options for ${node.name}`}
          // Reveal per row via the row-scoped group (see FolderRow); hover
          // anywhere on the row, including the action itself, reveals it.
          className="opacity-100 transition-opacity md:opacity-0 md:group-hover/folder-row:opacity-100 md:group-focus-within/folder-row:opacity-100 md:focus-visible:opacity-100 md:data-popup-open:opacity-100"
        >
          <MoreHorizontalIcon />
          <span className="sr-only">Folder options</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right">
        <DropdownMenuItem
          onClick={() => {
            void setFavorite({ id: node.id, favorite: !node.isFavorite }).catch(
              (error) => {
                console.error("Failed to update folder favorite", error);
              },
            );
          }}
        >
          <StarIcon className={node.isFavorite ? "fill-current" : undefined} />
          {node.isFavorite ? "Unfavorite" : "Favorite"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            onOpenDialog({ kind: "create-note", folderId: node.id })
          }
        >
          <NotebookPenIcon />
          Add note
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={atMaxDepth}
          title={
            atMaxDepth
              ? `Maximum nesting depth (${MAX_FOLDER_DEPTH - 1} levels) reached`
              : undefined
          }
          onClick={() =>
            onOpenDialog({
              kind: "create",
              parentId: node.id,
              parentDepth: node.depth,
            })
          }
        >
          <PlusIcon />
          New subfolder
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            onOpenDialog({ kind: "rename", id: node.id, name: node.name })
          }
        >
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            onOpenDialog({
              kind: "delete",
              id: node.id,
              name: node.name,
              hasChildren: node.children.length > 0,
            })
          }
        >
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
