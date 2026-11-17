"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { useQuery } from "convex/react";
import Link from "next/link";

import { useActiveTopic } from "@/components/topic-provider";

/** Guard so a corrupt parent chain can never loop forever. */
const MAX_CHAIN_STEPS = 10;

/**
 * Header breadcrumb for a folder page: Home → Notes → folder ancestor path.
 * Shows a graceful placeholder while folders load and "Folder not found"
 * once the list is loaded and the folder is missing (e.g. deleted).
 */
export function FolderBreadcrumb({
  folderId,
}: {
  folderId: Id<"book_folders">;
}) {
  const { topicId } = useActiveTopic();
  const folders = useQuery(
    api.bookFolders.list,
    topicId !== null ? { topicId } : "skip",
  );

  // Walk up the parent chain to build the topic/folder path.
  const chain: { id: Id<"book_folders">; name: string }[] = [];
  if (folders) {
    let current = folders.find((folder) => folder.id === folderId);
    while (current && chain.length < MAX_CHAIN_STEPS) {
      chain.unshift({ id: current.id, name: current.name });
      const parentId = current.parentId;
      current = parentId
        ? folders.find((folder) => folder.id === parentId)
        : undefined;
    }
  }

  // undefined while loading; false once loaded and the folder is gone.
  const found = folders === undefined ? undefined : chain.length > 0;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/home">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/home/notes">Notes</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {chain.map((folder) => (
          <span key={folder.id} className="contents">
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href={`/home/notes/f/${folder.id}`}>{folder.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </span>
        ))}
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {found === false
              ? "Folder not found"
              : (chain.at(-1)?.name ?? "…")}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
