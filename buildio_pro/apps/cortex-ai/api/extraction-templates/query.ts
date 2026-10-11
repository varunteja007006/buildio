"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createExtractionTemplate,
  deleteExtractionTemplate,
  generateTemplateSuggestion,
  getExtractionTemplates,
  permanentlyDeleteExtractionTemplate,
  restoreExtractionTemplate,
  updateExtractionTemplate,
} from "./api";
import type { TemplateInput } from "./types";

export const extractionTemplateKeys = {
  all: ["extraction-templates"] as const,
  list: (page: number, pageSize: number, status: "active" | "deleted") =>
    ["extraction-templates", "list", page, pageSize, status] as const,
};

export function useExtractionTemplates(
  page: number,
  pageSize: number,
  status: "active" | "deleted" = "active",
) {
  return useQuery({
    queryKey: extractionTemplateKeys.list(page, pageSize, status),
    queryFn: () => getExtractionTemplates(page, pageSize, status),
  });
}

function invalidateTemplates(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({
    queryKey: extractionTemplateKeys.all,
  });
}

export function useCreateExtractionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TemplateInput) => createExtractionTemplate(input),
    onSuccess: () => invalidateTemplates(queryClient),
  });
}

export function useUpdateExtractionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<TemplateInput>;
    }) => updateExtractionTemplate(id, input),
    onSuccess: () => invalidateTemplates(queryClient),
  });
}

export function useDeleteExtractionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExtractionTemplate,
    onSuccess: () => invalidateTemplates(queryClient),
  });
}

export function useRestoreExtractionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreExtractionTemplate,
    onSuccess: () => invalidateTemplates(queryClient),
  });
}

export function usePermanentlyDeleteExtractionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: permanentlyDeleteExtractionTemplate,
    onSuccess: () => invalidateTemplates(queryClient),
  });
}

/** Draft a template suggestion from a sample doc; nothing is persisted. */
export function useGenerateTemplateSuggestion() {
  return useMutation({ mutationFn: generateTemplateSuggestion });
}
