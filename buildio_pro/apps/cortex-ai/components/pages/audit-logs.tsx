"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";

import { useAuditLogs } from "@/api/audit-logs/query";
import type { ChatAuditLog } from "@/api/audit-logs/types";
import { useDocumentAuditLogs } from "@/api/document-audit-logs/query";
import {
  DOCUMENT_AUDIT_ACTIONS,
  type DocumentAuditAction,
  type DocumentAuditLog,
} from "@/api/document-audit-logs/types";
import { AuditLogDetailsDialog } from "@/components/audit-logs/audit-log-details-dialog";
import { getChatAuditColumns } from "@/components/audit-logs/chat-audit-columns";
import {
  ACTION_LABELS,
  getDocumentAuditColumns,
} from "@/components/audit-logs/document-audit-columns";
import { DocumentAuditDetailsDialog } from "@/components/audit-logs/document-audit-details-dialog";
import { AuditPaginationFooter } from "@/components/audit-logs/pagination-footer";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";

const PAGE_SIZE = 20;

type Tab = "chat" | "documents";

const TABS: { value: Tab; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "documents", label: "Documents" },
];

export function AuditLogsPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [chatPage, setChatPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const [docAction, setDocAction] = useState<string>("all");
  const [chatSelected, setChatSelected] = useState<ChatAuditLog | null>(null);
  const [docSelected, setDocSelected] = useState<DocumentAuditLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const chat = useAuditLogs({ page: chatPage, pageSize: PAGE_SIZE });
  const documents = useDocumentAuditLogs({
    page: docPage,
    pageSize: PAGE_SIZE,
    action: docAction === "all" ? undefined : docAction,
  });

  const isChat = tab === "chat";
  const page = isChat ? chatPage : docPage;
  const data = isChat ? chat.data : documents.data;
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  const chatColumns = getChatAuditColumns((log) => {
    setChatSelected(log);
    setDialogOpen(true);
  });
  const documentColumns = getDocumentAuditColumns((log) => {
    setDocSelected(log);
    setDialogOpen(true);
  });

  return (
    <>
      <PageHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents", href: "/dashboard/documents" },
          { label: "Audit Logs" },
        ]}
        title="Audit Logs"
        description="Chat and document activity recorded across the workspace."
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          {TABS.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={tab === item.value ? "default" : "outline"}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </Button>
          ))}

          {!isChat && (
            <Select
              value={docAction}
              onValueChange={(value) => {
                setDocAction(value);
                setDocPage(1);
              }}
            >
              <SelectTrigger size="sm" className="ml-auto w-48">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {DOCUMENT_AUDIT_ACTIONS.map((action: DocumentAuditAction) => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isChat ? (
          <DataTable
            columns={chatColumns}
            data={chat.data?.logs ?? []}
            keyExtractor={(log) => log.id}
            loading={chat.isLoading}
            emptyMessage="No chat activity recorded yet."
          />
        ) : (
          <DataTable
            columns={documentColumns}
            data={documents.data?.logs ?? []}
            keyExtractor={(log) => log.id}
            loading={documents.isLoading}
            emptyMessage="No document activity recorded yet."
          />
        )}

        <AuditPaginationFooter
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={isChat ? setChatPage : setDocPage}
        />
      </div>

      <AuditLogDetailsDialog
        log={chatSelected}
        open={dialogOpen && isChat}
        onOpenChange={setDialogOpen}
      />
      <DocumentAuditDetailsDialog
        log={docSelected}
        open={dialogOpen && !isChat}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
