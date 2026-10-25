"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createResource, deleteResource, getResource, getResources } from "./api";
import type { Resource, CreateResourceInput } from "./types";

/** Query key factory for resources domain */
export const resourceKeys = {
  all: ["resources"] as const,
};

/** Fetch all resources */
export function useResources() {
  return useQuery<Resource[]>({
    queryKey: resourceKeys.all,
    queryFn: getResources,
  });
}

/** Fetch one resource's full content (on-demand; null id disables the query) */
export function useResourceContent(id: string | null, enabled = true) {
  return useQuery<Resource>({
    queryKey: [...resourceKeys.all, "detail", id],
    queryFn: () => getResource(id as string),
    enabled: enabled && id !== null,
  });
}

/** Create a new resource */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation<Resource, Error, CreateResourceInput>({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}

/** Delete a resource */
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}
