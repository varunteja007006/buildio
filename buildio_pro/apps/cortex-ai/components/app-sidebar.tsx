"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { FileTextIcon, BotIcon } from "lucide-react";
import * as React from "react";

import { useSession } from "@/api/auth/query";
import { NavChats } from "@/components/nav-chats";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const navMain = [
  // {
  //   title: "Chat",
  //   url: "/dashboard/chat",
  //   icon: <MessageSquareIcon />,
  //   isActive: true,
  //   items: [
  //     { title: "New Chat", url: "/dashboard/chat" },
  //   ],
  // },
  {
    title: "Documents",
    url: "/dashboard/documents",
    icon: <FileTextIcon />,
    items: [
      { title: "Documents", url: "/dashboard/documents" },
      { title: "Extraction", url: "/dashboard/documents/extraction-templates" },
      { title: "Ingestion", url: "/dashboard/documents/ingestion" },
      { title: "Audit Logs", url: "/dashboard/documents/audit-logs" },
      { title: "Trash", url: "/dashboard/documents/trash" },
    ],
  },
  {
    title: "Agent",
    url: "/dashboard/agent/builder",
    icon: <BotIcon />,
    items: [
      { title: "Builder", url: "/dashboard/agent/builder" },
      { title: "Toolboxes", url: "/dashboard/agent/toolboxes" },
      { title: "Instruction templates", url: "/dashboard/agent/templates" },
      { title: "Connectors", url: "/dashboard/agent/connectors" },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isLoading } = useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavChats />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
        ) : session?.user ? (
          <NavUser user={session.user} />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
