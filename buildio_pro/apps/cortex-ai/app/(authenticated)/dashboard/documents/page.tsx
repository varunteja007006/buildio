import { DocumentsView } from "@/components/documents/documents-view";
import { PageHeader } from "@/components/page-header";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents" },
        ]}
        title="Documents"
        description="Upload, organize, and manage the documents available to your agents."
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <DocumentsView />
      </div>
    </>
  );
}
