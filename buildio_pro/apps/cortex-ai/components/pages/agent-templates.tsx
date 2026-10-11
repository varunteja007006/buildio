"use client";

import { AgentTemplatesSection } from "@/components/agent-templates/agent-templates-section";
import { PageHeader } from "@/components/page-header";

export function AgentTemplatesPage() {
  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agent", href: "/dashboard/agent/builder" },
          { label: "Instruction templates" },
        ]}
        title="Instruction templates"
        description="Reusable instruction sets. Applying one copies its text into an agent."
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <AgentTemplatesSection />
      </div>
    </>
  );
}
