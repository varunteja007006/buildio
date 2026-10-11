"use client";

import { useRouter } from "next/navigation";

import { AgentsSection } from "@/components/agents/agents-section";
import { PageHeader } from "@/components/page-header";

export function AgentsPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agent", href: "/dashboard/agent/builder" },
          { label: "Builder" },
        ]}
        title="Agent Builder"
        description="Create agents, attach topics and tools, test in the playground, then deploy."
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <AgentsSection
          onOpenAgent={(id) => router.push(`/dashboard/agent/${id}`)}
        />
      </div>
    </>
  );
}
