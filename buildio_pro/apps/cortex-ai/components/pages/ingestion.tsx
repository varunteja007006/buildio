"use client";

import { IngestQueueSection } from "@/components/ingestion/queue-section";
import { PageHeader } from "@/components/page-header";

export function IngestionPage() {
  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents", href: "/dashboard/documents" },
          { label: "Ingestion" },
        ]}
        title="Ingestion"
        description="Chunk, embed, and keep document content searchable in chat."
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <IngestQueueSection />
      </div>
    </>
  );
}
