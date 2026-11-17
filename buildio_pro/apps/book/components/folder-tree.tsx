"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import {
  Collapsible,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { useQuery } from "convex/react";
import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { FolderMenu, type DialogState } from "@/components/folder-menu";
import { FolderNoteRow } from "@/components/folder-note-row";
import type { FolderNode } from "@/lib/folders";

function FolderTrigger({
  node,
  hasChildren,
  open,
  topLevel,
  onToggle,
}: {
  node: FolderNode;
  hasChildren: boolean;
  open: boolean;
  topLevel: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const href = `/home/notes/f/${node.id}`;
  const Icon = open && hasChildren ? FolderOpenIcon : FolderIcon;

  const favoriteMark = node.isFavorite ? (
    <StarIcon className="size-3.5 shrink-0 fill-current text-amber-500" />
  ) : null;

  // The row itself navigates to the folder page; the chevron stays the
  // expand/collapse control, so it must not follow the link.
  const chevron = hasChildren ? (
    <ChevronRightIcon
      className={cn(
        "size-4 shrink-0 transition-transform duration-200 group-data-open/collapsible:rotate-90",
        topLevel && "ml-auto",
      )}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onToggle();
      }}
    />
  ) : null;

  if (topLevel) {
    // Main folders align with other menu items; the chevron hugs the right
    // edge instead of padding the front.
    return (
      <SidebarMenuButton
        asChild
        isActive={pathname === href}
        tooltip={node.name}
      >
        <Link href={href}>
          <Icon />
          <span className="truncate">{node.name}</span>
          {favoriteMark}
          {chevron}
        </Link>
      </SidebarMenuButton>
    );
  }
  return (
    <SidebarMenuSubButton asChild isActive={pathname === href}>
      <Link
        href={href}
        // Reserve room for the hover action so it never covers the label.
        className="flex w-full items-center gap-2 pr-7 text-left"
      >
        {/* Disclosure chevron leads the row; leaves keep an invisible spacer
            so folder icons stay aligned at every depth. */}
        {chevron ?? <ChevronRightIcon className="invisible size-4 shrink-0" />}
        <Icon />
        <span className="truncate">{node.name}</span>
        {favoriteMark}
      </Link>
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
  // Each folder row subscribes to its own notes so the collapsed tree can
  // reveal them; folder counts are small, so per-row queries stay cheap.
  const notes = useQuery(api.books.listInFolder, { folderId: node.id });
  const hasNotes = (notes?.length ?? 0) > 0;
  const hasChildren = node.children.length > 0 || hasNotes;
  const trigger = (
    <FolderTrigger
      node={node}
      hasChildren={hasChildren}
      open={open}
      topLevel={topLevel}
      onToggle={() => setOpen((value) => !value)}
    />
  );
  const content = (
    <>
      {/* Row-scoped hover group: wraps only the trigger and action so
          hovering one nested row never reveals another row's actions. */}
      <div className="group/folder-row relative">
        {trigger}
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
            {notes?.map((note) => (
              <FolderNoteRow key={note.id} note={note} />
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
      render={
        topLevel ? (
          <SidebarMenuItem>{content}</SidebarMenuItem>
        ) : (
          <SidebarMenuSubItem>{content}</SidebarMenuSubItem>
        )
      }
    />
  );
}
