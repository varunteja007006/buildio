"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { ChartColumnIcon, HeartIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";


const items = [
  { title: "Favourites", url: "/home/favourites", icon: HeartIcon },
  { title: "Reviews", url: "/home/reviews", icon: StarIcon },
  { title: "Stats", url: "/home/stats", icon: ChartColumnIcon },
];

export function NavProjects() {
  const pathname = usePathname();

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
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}