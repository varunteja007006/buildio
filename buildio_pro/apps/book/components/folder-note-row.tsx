"use client";

import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import {
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar";
import { FileTextIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** One note rendered beneath its folder in the sidebar tree. */
export function FolderNoteRow({
  note,
}: {
  note: { id: Id<"books">; title: string; isFavorite: boolean };
}) {
  const pathname = usePathname();
  const href = `/home/notes/${note.id}`;
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={pathname === href}>
        <Link href={href} className="flex w-full items-center gap-2 text-left">
          <FileTextIcon className="size-4 shrink-0" />
          <span className="truncate">{note.title}</span>
          {note.isFavorite ? (
            <StarIcon className="size-3.5 shrink-0 fill-current text-amber-500" />
          ) : null}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
