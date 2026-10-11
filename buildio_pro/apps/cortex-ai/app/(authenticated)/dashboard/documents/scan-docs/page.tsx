import { FileTextIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";

export default function ScanDocsPage() {
  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents", href: "/dashboard/documents" },
          { label: "Scan Docs" },
        ]}
        title="Scan Docs"
        description="Scan documents here."
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <FileTextIcon className="size-12 text-muted-foreground" />
      </div>
    </>
  );
}
