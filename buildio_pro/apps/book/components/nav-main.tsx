"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { SidebarMenuSkeleton } from "@workspace/ui/components/sidebar-menu-sub";
import { useQuery } from "convex/react";
import { FolderPlusIcon } from "lucide-react";
import { useState } from "react";

import { FolderDeleteDialog } from "@/components/folder-delete-dialog";
import {
  FolderCreateDialog,
  FolderRenameDialog,
} from "@/components/folder-dialogs";
import { FolderRow, type DialogState } from "@/components/folder-tree";
import { buildFolderTree, MAX_MAIN_FOLDERS } from "@/lib/folders";

export function NavMain() {
  const folders = useQuery(api.bookFolders.list);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const tree = folders ? buildFolderTree(folders) : [];
  const mainCount =
    folders?.filter((folder) => folder.parentId === null).length ?? 0;
  const atMainLimit = mainCount >= MAX_MAIN_FOLDERS;
  const openCreate = () =>
    setDialog({ kind: "create", parentId: null, parentDepth: 0 });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organize</SidebarGroupLabel>
      <SidebarMenu>
        {folders === undefined ? (
          [0, 1, 2].map((index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          ))
        ) : tree.length === 0 ? (
          // Empty state: folders are the only way to organize here, so offer
          // a prominent add affordance.
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openCreate}>
              <FolderPlusIcon />
              <span>Add folder</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <>
            {tree.map((node) => (
              <FolderRow
                key={node.id}
                node={node}
                topLevel
                onOpenDialog={setDialog}
              />
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                disabled={atMainLimit}
                title={
                  atMainLimit
                    ? `Maximum of ${MAX_MAIN_FOLDERS} main folders reached`
                    : undefined
                }
                onClick={openCreate}
              >
                <FolderPlusIcon />
                <span>Add folder</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
      <FolderCreateDialog
        parentId={dialog?.kind === "create" ? dialog.parentId : null}
        parentDepth={dialog?.kind === "create" ? dialog.parentDepth : 0}
        open={dialog?.kind === "create"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      />
      <FolderRenameDialog
        folder={
          dialog?.kind === "rename"
            ? { id: dialog.id, name: dialog.name }
            : null
        }
        open={dialog?.kind === "rename"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      />
      <FolderDeleteDialog
        folder={
          dialog?.kind === "delete"
            ? {
                id: dialog.id,
                name: dialog.name,
                hasChildren: dialog.hasChildren,
              }
            : null
        }
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      />
    </SidebarGroup>
  );
}