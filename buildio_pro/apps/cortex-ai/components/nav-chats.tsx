"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@workspace/ui/components/sidebar";
import {
  EyeIcon,
  EyeOffIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  useChatThreads,
  useCreateOrGetEmptyThread,
  useDeleteChatThread,
  useRestoreChatThread,
} from "@/api/chat/query";

/** Recent chat threads, linking into /dashboard/chat/[threadId]. */
export function NavChats() {
  const [showDeleted, setShowDeleted] = useState(false);
  // SidebarMenuSkeleton uses Math.random() for width, so it must not be
  // server-rendered — defer the loading state until after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useChatThreads(15, showDeleted);
  const params = useParams<{ threadId?: string }>();
  const activeId = params?.threadId;
  const router = useRouter();

  const createThread = useCreateOrGetEmptyThread();
  const deleteThread = useDeleteChatThread();
  const restoreThread = useRestoreChatThread();

  const threads = data?.pages.flatMap((page) => page.threads) ?? [];

  const handleNewChat = () => {
    createThread.mutate(undefined, {
      onSuccess: ({ thread }) => router.push(`/dashboard/chat/${thread.id}`),
    });
  };

  // Deleting never creates a new chat. If the active thread is removed, the
  // chat view falls back to its "Conversation unavailable" state.
  const handleDelete = (id: string) => {
    deleteThread.mutate(id);
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>History</SidebarGroupLabel>
      <SidebarGroupAction
        title={showDeleted ? "Hide deleted chats" : "Show deleted chats"}
        onClick={() => setShowDeleted((value) => !value)}
      >
        {showDeleted ? <EyeOffIcon /> : <EyeIcon />}
        <span className="sr-only">
          {showDeleted ? "Hide deleted chats" : "Show deleted chats"}
        </span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleNewChat}
              disabled={createThread.isPending}
            >
              <PlusIcon />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {mounted && isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))
            : threads.map((thread) => (
                <SidebarMenuItem key={thread.id}>
                  {showDeleted ? (
                    <SidebarMenuButton className="text-muted-foreground">
                      <MessageSquareIcon />
                      <span className="truncate line-through">
                        {thread.title ?? "New chat"}
                      </span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={thread.id === activeId}
                    >
                      <Link href={`/dashboard/chat/${thread.id}`}>
                        <MessageSquareIcon />
                        <span className="truncate">
                          {thread.title ?? "New chat"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  )}

                  {showDeleted ? (
                    <SidebarMenuAction
                      showOnHover
                      title="Restore chat"
                      onClick={() => restoreThread.mutate(thread.id)}
                    >
                      <RotateCcwIcon />
                      <span className="sr-only">Restore chat</span>
                    </SidebarMenuAction>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          showOnHover
                          className="data-popup-open:bg-muted"
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-fit">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(thread.id)}
                        >
                          <Trash2Icon />
                          <span>Delete chat</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
