import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

import type {
  Connection,
  ConnectionInput,
  ConnectionPage,
  ConnectorTable,
  ConnectorTableMetadata,
  ConnectorMetadata,
  DeleteResponse,
  ProbeResult,
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

export async function getConnectorTables(id: string) {
  const { data } = await apiClient.get<{ tables: ConnectorTable[] }>(
    endpoints.connections.tables(id),
  );
  return data;
}

export async function getConnectorTableDetails(
  id: string,
  schema: string,
  name: string,
) {
  const { data } = await apiClient.get<{ details: ConnectorTableMetadata }>(
    endpoints.connections.tableDetails(id),
    { params: { schema, name } },
  );
  return data.details;
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
  const { data } = await apiClient.get<{ metadata: ConnectorMetadata }>(
    endpoints.connections.descriptionPreview(id),
    { signal },
  );
  return data.metadata;
}

export async function permanentlyDeleteConnection(id: string) {
  const { data } = await apiClient.delete<DeleteResponse>(
    endpoints.connections.permanent(id),
  );
  return data;
}
