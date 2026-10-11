"use client";

import { PageHeader } from "@/components/page-header";
import { ToolboxesSection } from "@/components/toolboxes/toolboxes-section";

export function ToolboxesPage() {
  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agent", href: "/dashboard/agent/builder" },
          { label: "Toolboxes" },
        ]}
        title="Toolboxes"
        description="Reusable tool groups. Tools inside toolboxes are not individually attachable to agents."
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <ToolboxesSection />
      </div>
    </>
  );
}
