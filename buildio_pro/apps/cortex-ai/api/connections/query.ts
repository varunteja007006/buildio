"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkConnection,
  createConnection,
  deleteConnection,
  getConnection,
  getConnections,
  getSchemaTable,
  getSchemaTables,
  permanentlyDeleteConnection,
  refreshSchema,
  relinkSchemaTable,
  restoreConnection,
  testConnection,
  updateConnection,
  updateConnectorContext,
  updateSchemaTableContext,
} from "./api";
import type {
  ConnectionInput,
  ProbeResult,
  SchemaTableContextInput,
  SchemaTableRelinkInput,
} from "./types";

export const connectionKeys = {
  all: ["connections"] as const,
  list: (page: number, pageSize: number, status: "active" | "deleted") =>
    ["connections", "list", page, pageSize, status] as const,
  detail: (id: string) => ["connections", "detail", id] as const,
  schema: (id: string) => ["connections", "schema", id] as const,
  schemaList: (
    id: string,
    filters: {
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ) => ["connections", "schema", id, filters] as const,
  schemaTable: (id: string, tableId: string) =>
    ["connections", "schema-table", id, tableId] as const,
};

export function useConnection(id: string) {
  return useQuery({
    queryKey: connectionKeys.detail(id),
    queryFn: () => getConnection(id),
  });
}

export function useConnections(
  page: number,
  pageSize: number,
  status: "active" | "deleted" = "active",
) {
  return useQuery({
    queryKey: connectionKeys.list(page, pageSize, status),
    queryFn: () => getConnections(page, pageSize, status),
  });
}

function invalidateConnections(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({
    queryKey: connectionKeys.all,
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: testConnection,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectionInput) => createConnection(input),
    onSuccess: () => invalidateConnections(queryClient),
  });
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ConnectionInput>;
    }) => updateConnection(id, input),
    onSuccess: () => invalidateConnections(queryClient),
  });
}

export function useUpdateConnectorContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      updateConnectorContext(id, description),
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: connectionKeys.detail(id) }),
  });
}

export function useCheckConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkConnection,
    onSuccess: () => invalidateConnections(queryClient),
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => invalidateConnections(queryClient),
  });
}

export function useRestoreConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreConnection,
    onSuccess: () => invalidateConnections(queryClient),
  });
}

export function usePermanentlyDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: permanentlyDeleteConnection,
    onSuccess: () => invalidateConnections(queryClient),
  });
}

function invalidateSchema(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.invalidateQueries({
    queryKey: connectionKeys.schema(id),
  });
}

export function useSchemaTables(
  id: string,
  filters: {
    status?: "active" | "removed" | "needs-review" | "all";
    search?: string;
    schema?: string;
    objectType?: string;
    page?: number;
    pageSize?: number;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: connectionKeys.schemaList(id, filters),
    queryFn: () => getSchemaTables(id, filters),
    enabled,
  });
}

export function useSchemaTable(id: string, tableId: string, enabled = true) {
  return useQuery({
    queryKey: connectionKeys.schemaTable(id, tableId),
    queryFn: () => getSchemaTable(id, tableId),
    enabled,
  });
}

export function useRefreshSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input?: { declareReplacement?: boolean };
    }) => refreshSchema(id, input),
    onSuccess: (_data, { id }) => invalidateSchema(queryClient, id),
  });
}

export function useUpdateSchemaTableContext(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      input,
    }: {
      tableId: string;
      input: SchemaTableContextInput;
    }) => updateSchemaTableContext(id, tableId, input),
    onSuccess: (_data, { tableId }) => {
      void queryClient.invalidateQueries({
        queryKey: connectionKeys.schemaTable(id, tableId),
      });
      void invalidateSchema(queryClient, id);
    },
  });
}

export function useRelinkSchemaTable(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      input,
    }: {
      tableId: string;
      input: SchemaTableRelinkInput;
    }) => relinkSchemaTable(id, tableId, input),
    onSuccess: () => invalidateSchema(queryClient, id),
  });
}

export type { ProbeResult };
