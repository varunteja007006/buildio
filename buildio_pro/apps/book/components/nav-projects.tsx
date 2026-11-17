"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { useQuery } from "convex/react";
import { HeartIcon, NotebookPenIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useActiveTopic } from "@/components/topic-provider";

export function NavProjects() {
  const pathname = usePathname();
  // Counts are topic-scoped for notes; favourites stay global like the
  // favourites shelf. Skip the query until a topic resolves.
  const { topicId } = useActiveTopic();
  const counts = useQuery(
    api.books.counts,
    topicId !== null ? { topicId } : "skip",
  );

  const items = [
    {
      title: "Favourites",
      url: "/home/favourites",
      icon: HeartIcon,
      count: counts?.favorites,
    },
    {
      title: "All Notes",
      url: "/home/notes",
      icon: NotebookPenIcon,
      count: counts?.notes,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Collections</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.url}
              tooltip={item.title}
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {item.count !== undefined && (
              <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
