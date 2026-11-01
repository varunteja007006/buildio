"use client";

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
import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
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

/** Per-folder actions menu (new subfolder / rename / delete). */
function FolderMenu({
  node,
  onOpenDialog,
}: {
  node: FolderNode;
  onOpenDialog: (dialog: DialogState) => void;
}) {
  const atMaxDepth = node.depth >= MAX_FOLDER_DEPTH;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction aria-label={`Folder options for ${node.name}`}>
          <MoreHorizontalIcon />
          <span className="sr-only">Folder options</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right">
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

  if (topLevel) {
    // Main folders align with other menu items; the chevron hugs the right
    // edge instead of padding the front.
    return (
      <SidebarMenuButton tooltip={node.name}>
        <Icon />
        <span className="truncate">{node.name}</span>
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
        className="flex w-full items-center gap-2 text-left"
      >
        <Icon />
        <span className="truncate">{node.name}</span>
        {hasChildren ? (
          <ChevronRightIcon className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        ) : null}
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
      {hasChildren ? (
        <CollapsibleTrigger asChild>{trigger}</CollapsibleTrigger>
      ) : (
        trigger
      )}
      <FolderMenu node={node} onOpenDialog={onOpenDialog} />
      {hasChildren ? (
        <CollapsibleContent>
          <SidebarMenuSub>
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
