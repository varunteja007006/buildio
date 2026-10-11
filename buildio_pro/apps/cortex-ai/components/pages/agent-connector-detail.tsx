"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useConnection,
  useConnectionTables,
  useUpdateConnectorContext,
} from "@/api/connections/query";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { StatusBadge } from "@/components/connections/connection-columns";
import { ConnectorDescriptionDialog } from "@/components/pages/connector-description-dialog";
import { ConnectorTableBrowser } from "@/components/pages/connector-table-browser";

type AgentConnectorDetailPageProps = { connectionId: string };

export function AgentConnectorDetailPage({
  connectionId,
}: AgentConnectorDetailPageProps) {
  const detail = useConnection(connectionId);
  const connection = detail.data?.connection ?? null;
  const [description, setDescription] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const updateContext = useUpdateConnectorContext();
  useEffect(
    () => setDescription(connection?.description ?? ""),
    [connection?.description],
  );
  const supportsTables =
    connection?.type === "postgres" || connection?.type === "mongodb";
  const tables = useConnectionTables(connectionId, Boolean(supportsTables));
  const heading = supportsTables
    ? connection?.type === "mongodb"
      ? "Collections"
      : "Database objects"
    : "Tables";

  if (detail.isLoading)
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  if (detail.isError || !connection)
    return (
      <p className="text-sm text-destructive">
        {detail.error instanceof Error
          ? detail.error.message
          : "Connection not found."}
      </p>
    );

  return (
    <>
      <AppBreadcrumb
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agent", href: "/dashboard/agent/builder" },
          { label: "Connectors", href: "/dashboard/agent/connectors" },
          { label: connection.name },
        ]}
      />
      <div className="flex w-full flex-1 flex-col gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold">
            {connection.name}
            <Badge variant="secondary" className="capitalize">
              {connection.type}
            </Badge>
            <StatusBadge status={connection.status} />
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {connection.target}
          </p>
        </div>
        <section className="flex w-full flex-col gap-2">
          <div>
            <h2 className="text-sm font-medium">About this connector</h2>
            <p className="text-sm text-muted-foreground">
              Explain what this data source contains and how an AI agent should
              interpret it.
            </p>
          </div>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={4000}
            rows={5}
            placeholder="For example: This database contains sales orders. Use completed orders for revenue reporting; refunds are stored separately."
            aria-label="Connector explanation"
          />
          <div className="flex flex-wrap gap-2">
            {connection.type === "postgres" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateOpen(true)}
              >
                <Sparkles /> Generate with AI
              </Button>
            )}
            <Button
              className="self-start"
              disabled={
                updateContext.isPending ||
                description === (connection.description ?? "")
              }
              onClick={() =>
                updateContext.mutate(
                  { id: connectionId, description },
                  {
                    onSuccess: () =>
                      toast.success("Connector explanation saved"),
                    onError: (error) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to save explanation",
                      ),
                  },
                )
              }
            >
              {updateContext.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              Save explanation
            </Button>
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">{heading}</h2>
          {tables.isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : tables.isError ? (
            <p className="text-sm text-destructive">
              {tables.error instanceof Error
                ? tables.error.message
                : "Unable to load tables."}
            </p>
          ) : (tables.data?.tables.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No database objects found.
            </p>
          ) : (
            <ConnectorTableBrowser
              connectionId={connectionId}
              tables={tables.data?.tables ?? []}
              postgres={connection.type === "postgres"}
            />
          )}
        </section>
      </div>
      <ConnectorDescriptionDialog
        connectionId={connectionId}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={setDescription}
      />
    </>
  );
}
