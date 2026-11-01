"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import {
  BadgeCheckIcon,
  BookMarkedIcon,
  BookOpenIcon,
  BookmarkIcon,
  NotebookPenIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";


const items = [
  { title: "Library", url: "/home/library", icon: BookMarkedIcon },
  { title: "Currently Reading", url: "/home/reading", icon: BookOpenIcon },
  { title: "Want to Read", url: "/home/wishlist", icon: BookmarkIcon },
  { title: "Finished", url: "/home/finished", icon: BadgeCheckIcon },
  { title: "Notes", url: "/home/notes", icon: NotebookPenIcon },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Reading</SidebarGroupLabel>
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
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}