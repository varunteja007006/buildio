"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation } from "convex/react";
import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

import {
  MAX_FOLDER_DEPTH,
  type FolderId,
  type FolderNode,
} from "@/lib/folders";

export type DialogState =
  | { kind: "create"; parentId: FolderId | null; parentDepth: number }
  | { kind: "rename"; id: FolderId; name: string }
  | { kind: "delete"; id: FolderId; name: string; hasChildren: boolean };

/** Per-folder actions menu (favorite / new subfolder / rename / delete). */
function FolderMenu({
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
          className="opacity-100 transition-opacity md:opacity-0 md:group-hover/folder-row:opacity-100 md:group-focus-within/folder-row:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
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

function FolderTrigger({
  node,
  hasChildren,
  open,
  topLevel,
}: {
  node: FolderNode;
  hasChildren: boolean;
  open: boolean;
  topLevel: boolean;
}) {
  const Icon = open && hasChildren ? FolderOpenIcon : FolderIcon;

  const favoriteMark = node.isFavorite ? (
    <StarIcon className="size-3.5 shrink-0 fill-current text-amber-500" />
  ) : null;

  if (topLevel) {
    // Main folders align with other menu items; the chevron hugs the right
    // edge instead of padding the front.
    return (
      <SidebarMenuButton tooltip={node.name}>
        <Icon />
        <span className="truncate">{node.name}</span>
        {favoriteMark}
        {hasChildren ? (
          <ChevronRightIcon className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        ) : null}
      </SidebarMenuButton>
    );
  }
  return (
    <SidebarMenuSubButton asChild>
      <button
        type="button"
        // Reserve room for the hover action so it never covers the label.
        className="flex w-full items-center gap-2 pr-7 text-left"
      >
        {/* Disclosure chevron leads the row; leaves keep an invisible spacer
            so folder icons stay aligned at every depth. */}
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
            !hasChildren && "invisible",
          )}
        />
        <Icon />
        <span className="truncate">{node.name}</span>
        {favoriteMark}
      </button>
    </SidebarMenuSubButton>
  );
}

/** Renders a folder row (with optional nested children) at the given level. */
export function FolderRow({
  node,
  topLevel,
  onOpenDialog,
}: {
  node: FolderNode;
  topLevel: boolean;
  onOpenDialog: (dialog: DialogState) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const trigger = (
    <FolderTrigger
      node={node}
      hasChildren={hasChildren}
      open={open}
      topLevel={topLevel}
    />
  );
  const content = (
    <>
      {/* Row-scoped hover group: wraps only the trigger and action so
          hovering one nested row never reveals another row's actions. */}
      <div className="group/folder-row relative">
        {hasChildren ? (
          <CollapsibleTrigger asChild>{trigger}</CollapsibleTrigger>
        ) : (
          trigger
        )}
        <FolderMenu node={node} onOpenDialog={onOpenDialog} />
      </div>
      {hasChildren ? (
        <CollapsibleContent>
          {/* Cap the recursive indent: the stock mx-3.5 px-2.5 costs 48px per
              level, which starves depth-6 labels of any width. */}
          <SidebarMenuSub className="ml-2.5 mr-0 pl-1.5 pr-0">
            {node.children.map((child) => (
              <FolderRow
                key={child.id}
                node={child}
                topLevel={false}
                onOpenDialog={onOpenDialog}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      ) : null}
    </>
  );

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      asChild
    >
      {topLevel ? (
        <SidebarMenuItem>{content}</SidebarMenuItem>
      ) : (
        <SidebarMenuSubItem>{content}</SidebarMenuSubItem>
      )}
    </Collapsible>
  );
}
