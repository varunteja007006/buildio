import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

import type {
  Connection,
  ConnectionInput,
  ConnectionPage,
  ConnectorMetadata,
  DeleteResponse,
  ProbeResult,
  SchemaRefreshResult,
  SchemaTableContextInput,
  SchemaTableDetail,
  SchemaTablePage,
  SchemaTableRelinkInput,
} from "./types";

export async function getConnections(
  page: number,
  pageSize: number,
  status: "active" | "deleted" = "active",
) {
  const { data } = await apiClient.get<ConnectionPage>(
    endpoints.connections.list,
    { params: { page, pageSize, ...(status === "deleted" ? { status } : {}) } },
  );
  return data;
}

export async function getConnection(id: string) {
  const { data } = await apiClient.get<{ connection: Connection }>(
    endpoints.connections.detail(id),
  );
  return data;
}

export async function testConnection(input: ConnectionInput) {
  const { data } = await apiClient.post<ProbeResult>(
    endpoints.connections.test,
    input,
  );
  return data;
}

export async function createConnection(input: ConnectionInput) {
  const { data } = await apiClient.post<{ connection: Connection }>(
    endpoints.connections.list,
    input,
  );
  return data;
}

export async function updateConnection(
  id: string,
  input: Partial<ConnectionInput>,
) {
  const { data } = await apiClient.patch<{ connection: Connection }>(
    endpoints.connections.detail(id),
    input,
  );
  return data;
}

export async function checkConnection(id: string) {
  const { data } = await apiClient.post<{
    connection: Connection;
    probe: ProbeResult;
  }>(endpoints.connections.check(id));
  return data;
}

export async function deleteConnection(id: string) {
  const { data } = await apiClient.delete<DeleteResponse>(
    endpoints.connections.detail(id),
  );
  return data;
}

export async function restoreConnection(id: string) {
  const { data } = await apiClient.post<{ connection: { id: string } }>(
    endpoints.connections.restore(id),
  );
  return data;
}

export async function updateConnectorContext(id: string, description: string) {
  const { data } = await apiClient.patch<{ success: boolean }>(
    endpoints.connections.context(id),
    { description },
  );
  return data;
}

export async function getConnectorDescriptionMetadata(
  id: string,
  signal?: AbortSignal,
) {
  const { data } = await apiClient.get<{
    metadata: ConnectorMetadata;
    savedExplanationCount: number;
  }>(endpoints.connections.descriptionPreview(id), { signal });
  return data;
}

export async function permanentlyDeleteConnection(id: string) {
  const { data } = await apiClient.delete<DeleteResponse>(
    endpoints.connections.permanent(id),
  );
  return data;
}

export async function getSchemaTables(
  id: string,
  params: {
    status?: "active" | "removed" | "needs-review" | "all";
    search?: string;
    schema?: string;
    objectType?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const { data } = await apiClient.get<SchemaTablePage>(
    endpoints.connections.schema(id),
    { params },
  );
  return data;
}

export async function refreshSchema(
  id: string,
  input: { declareReplacement?: boolean } = {},
) {
  const { data } = await apiClient.post<SchemaRefreshResult>(
    endpoints.connections.schemaRefresh(id),
    input,
  );
  return data;
}

export async function getSchemaTable(id: string, tableId: string) {
  const { data } = await apiClient.get<SchemaTableDetail>(
    endpoints.connections.schemaTable(id, tableId),
  );
  return data;
}

export async function updateSchemaTableContext(
  id: string,
  tableId: string,
  input: SchemaTableContextInput,
) {
  const { data } = await apiClient.patch<{ success: boolean; revision: number }>(
    endpoints.connections.schemaTableContext(id, tableId),
    input,
  );
  return data;
}

export async function relinkSchemaTable(
  id: string,
  tableId: string,
  input: SchemaTableRelinkInput,
) {
  const { data } = await apiClient.post<{ success: boolean }>(
    endpoints.connections.schemaTableRelink(id, tableId),
    input,
  );
  return data;
}
