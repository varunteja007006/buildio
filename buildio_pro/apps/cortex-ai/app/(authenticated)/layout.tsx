import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
