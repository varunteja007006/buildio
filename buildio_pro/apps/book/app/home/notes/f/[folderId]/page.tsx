import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import { Separator } from "@workspace/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { use } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { FolderBookshelf } from "@/components/books/folder-bookshelf";
import { FolderBreadcrumb } from "@/components/books/folder-breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopicProvider } from "@/components/topic-provider";

export default function FolderNotesPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  return (
    <TopicProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <FolderBreadcrumb folderId={folderId as Id<"book_folders">} />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <FolderBookshelf folderId={folderId as Id<"book_folders">} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TopicProvider>
  );
}
