import apiClient from "@/api/client";

import type { Resource, CreateResourceInput } from "./types";

/** Fetch all resources */
export async function getResources(): Promise<Resource[]> {
  const { data } = await apiClient.get<Resource[]>("/resources");
  return data;
}

/** Fetch one resource's full content */
export async function getResource(id: string): Promise<Resource> {
  const { data } = await apiClient.get<Resource>(`/resources/${id}`);
  return data;
}

/** Create a new resource (chunk + embed + store) */
export async function createResource(
  input: CreateResourceInput,
): Promise<Resource> {
  const { data } = await apiClient.post<Resource>("/resources", input);
  return data;
}

/** Delete a resource by id */
export async function deleteResource(id: string): Promise<void> {
  await apiClient.delete(`/resources/${id}`);
}
