"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkConnection,
  createConnection,
  deleteConnection,
  getConnection,
  getConnections,
  getConnectorTableDetails,
  getConnectorTables,
  permanentlyDeleteConnection,
  restoreConnection,
  testConnection,
  updateConnection,
  updateConnectorContext,
} from "./api";
import type { ConnectionInput, ProbeResult } from "./types";

export const connectionKeys = {
  all: ["connections"] as const,
  list: (page: number, pageSize: number, status: "active" | "deleted") =>
    ["connections", "list", page, pageSize, status] as const,
  tables: (id: string) => ["connections", "tables", id] as const,
  tableDetails: (id: string, schema: string, name: string) =>
    ["connections", "table-details", id, schema, name] as const,
  detail: (id: string) => ["connections", "detail", id] as const,
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

export function useConnectionTables(id: string, enabled: boolean) {
  return useQuery({
    queryKey: connectionKeys.tables(id),
    queryFn: () => getConnectorTables(id),
    enabled,
  });
}

export function useConnectionTableDetails(
  id: string,
  schema: string,
  name: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: connectionKeys.tableDetails(id, schema, name),
    queryFn: () => getConnectorTableDetails(id, schema, name),
    enabled,
    staleTime: 5 * 60 * 1000,
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

export type { ProbeResult };
