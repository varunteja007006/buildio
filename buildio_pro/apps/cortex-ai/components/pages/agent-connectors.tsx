"use client";

import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCheckConnection,
  useConnections,
  useCreateConnection,
  useDeleteConnection,
  usePermanentlyDeleteConnection,
  useRestoreConnection,
  useTestConnection,
  useUpdateConnection,
} from "@/api/connections/query";
import type {
  Connection,
  ConnectionInputType,
  ProbeResult,
} from "@/api/connections/types";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { getConnectionColumns } from "@/components/connections/connection-columns";
import {
  type ConnectionConfirmAction,
  ConnectionDeleteDialog,
} from "@/components/connections/connection-delete-dialog";
import {
  emptyDetailsForm,
  type DetailsFormState,
} from "@/components/connections/connection-details-form";
import { ConnectionDialog } from "@/components/connections/connection-dialog";
import { ConnectionList } from "@/components/connections/connection-list";
import { DEFAULT_PORTS } from "@/lib/connectors/validation";

const PAGE_SIZE = 10;

const listFiltersParser = {
  status: parseAsStringEnum(["active", "deleted"]).withDefault("active"),
  page: parseAsInteger.withDefault(1),
};

export function AgentConnectorsPage() {
  const router = useRouter();
  const [{ status, page }, setListFilters] = useQueryStates(listFiltersParser);
  const [dialog, setDialog] = useState<Connection | null | undefined>(
    undefined,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [connectionType, setConnectionType] =
    useState<ConnectionInputType>("postgres");
  const [form, setForm] = useState<DetailsFormState>(emptyDetailsForm);
  const [error, setError] = useState<string | null>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [confirm, setConfirm] = useState<ConnectionConfirmAction | null>(null);
  const { data, isLoading } = useConnections(page, PAGE_SIZE, status);
  const test = useTestConnection();
  const create = useCreateConnection();
  const update = useUpdateConnection();
  const check = useCheckConnection();
  const remove = useDeleteConnection();
  const restore = useRestoreConnection();
  const permanent = usePermanentlyDeleteConnection();
  const connections = data?.connections ?? [];
  const editing = dialog ? Boolean(dialog) : false;

  const openCreate = () => {
    setError(null);
    setProbe(null);
    setForm(emptyDetailsForm);
    setStep(1);
    setDialog(null);
  };
  const selectType = (type: ConnectionInputType) => {
    setConnectionType(type);
    setForm((current) => ({
      ...current,
      port: String(DEFAULT_PORTS[type]),
    }));
    setStep(2);
  };

  const openEdit = (connection: Connection) => {
    setError(null);
    setProbe(null);
    setConnectionType(connection.type as ConnectionInputType);
    setForm({
      name: connection.name,
      host: connection.host ?? "",
      port: String(connection.port ?? DEFAULT_PORTS[connection.type as ConnectionInputType] ?? 5432),
      database: connection.database ?? "",
      username: connection.username ?? "",
      password: "",
    });
    setStep(2);
    setDialog(connection);
  };
  const closeDialog = () => {
    if (!create.isPending && !update.isPending) setDialog(undefined);
  };
  const setField = (field: keyof DetailsFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setProbe(null);
  };

  const buildInput = () => ({
    name: form.name.trim(),
    type: connectionType,
    host: form.host.trim(),
    port: Number(form.port),
    database: form.database.trim(),
    username: form.username.trim(),
    password: form.password,
  });

  const runTest = async () => {
    setError(null);
    const input = buildInput();
    if (!input.name || !input.host || !input.database || !input.username) {
      setError("All fields except password are required.");
      return;
    }
    try {
      const result = await test.mutateAsync(input);
      setProbe(result);
    } catch (cause) {
      setProbe({
        ok: false,
        error: cause instanceof Error ? cause.message : "Connection failed",
      });
    }
  };

  const save = async () => {
    setError(null);
    const input = buildInput();
    if (!input.name || !input.host || !input.database || !input.username) {
      setError("All fields except password are required.");
      return;
    }
    const keepPassword = editing && !input.password;
    try {
      if (editing && dialog) {
        await update.mutateAsync({
          id: dialog.id,
          input: { ...input, password: keepPassword ? undefined : input.password },
        });
      } else {
        await create.mutateAsync(input);
      }
      setDialog(undefined);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save connection.",
      );
    }
  };

  const runCheck = async (connection: Connection) => {
    try {
      const result = await check.mutateAsync(connection.id);
      if (result.probe.ok)
        toast.success(`Connected to "${connection.name}"`, {
          description: `Latency ${result.probe.latencyMs ?? 0}ms`,
        });
      else
        toast.error(`Check failed for "${connection.name}"`, {
          description: result.probe.error,
        });
    } catch {
      toast.error("Connection check failed");
    }
  };

  const columns = getConnectionColumns({
    status,
    onEdit: openEdit,
    onCheck: runCheck,
    onDelete: (connection) => setConfirm({ kind: "delete", connection }),
    onRestore: (id) => restore.mutate(id),
    onPermanentDelete: (connection) =>
      setConfirm({ kind: "permanent", connection }),
    checkingId: check.isPending ? (check.variables ?? null) : null,
    deletePending: remove.isPending,
    permanentDeletePending: permanent.isPending,
  });

  const confirmDelete = async (action: ConnectionConfirmAction) => {
    try {
      if (action.kind === "delete")
        await remove.mutateAsync(action.connection.id);
      else await permanent.mutateAsync(action.connection.id);
      setConfirm(null);
    } catch {
      // Error surfaced by mutation state; keep dialog open for retry.
    }
  };

  const canSave = Boolean(probe?.ok) || (editing && !form.password);

  const openTables = (connection: Connection) => {
    if (connection.type !== "postgres" && connection.type !== "mongodb") {
      toast.info(`Table browsing is not supported for ${connection.type} yet`);
      return;
    }
    router.push(`/dashboard/agent/connectors/${connection.id}`);
  };

  return (
    <>
      <AppBreadcrumb
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agent", href: "/dashboard/agent/builder" },
          { label: "Connectors" },
        ]}
      />
      <div className="flex w-full flex-1 flex-col gap-3">
        <ConnectionList
          data={data}
          connections={connections}
          columns={columns}
          isLoading={isLoading}
          page={page}
          status={status}
          onStatusChange={(next) => setListFilters({ status: next, page: 1 })}
          onPageChange={(next) => setListFilters({ page: next })}
          onNew={openCreate}
          onRowClick={openTables}
        />
      </div>
      <ConnectionDialog
        connection={dialog}
        step={step}
        form={form}
        editing={editing}
        selectedType={connectionType}
        onTypeSelect={selectType}
        error={error}
        testing={test.isPending}
        probe={probe}
        canSave={canSave}
        pending={create.isPending || update.isPending}
        onStepChange={setStep}
        onChange={setField}
        onTest={runTest}
        onSave={save}
        onClose={closeDialog}
      />
      <ConnectionDeleteDialog
        confirm={confirm}
        onClose={() => setConfirm(null)}
        deletePending={remove.isPending}
        permanentDeletePending={permanent.isPending}
        onConfirm={(action) => void confirmDelete(action)}
      />
    </>
  );
}