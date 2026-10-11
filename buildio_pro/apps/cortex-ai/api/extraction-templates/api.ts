import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

import type {
  DeleteResponse,
  ExtractionTemplate,
  TemplateInput,
  TemplatePage,
  TemplateSuggestion,
} from "./types";

/** Suggest a template from a sample document; the file is never stored. */
export async function generateTemplateSuggestion(
  file: File,
): Promise<TemplateSuggestion> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`/api${endpoints.extractionTemplates.generate}`, {
    method: "POST",
    body,
  });
  const payload = (await response.json().catch(() => null)) as {
    suggestion?: TemplateSuggestion;
    error?: string;
  } | null;
  if (!response.ok || !payload?.suggestion)
    throw new Error(payload?.error ?? "Unable to generate a template suggestion");
  return payload.suggestion;
}

export async function getExtractionTemplates(
  page: number,
  pageSize: number,
  status: "active" | "deleted" = "active",
) {
  const { data } = await apiClient.get<TemplatePage>(
    endpoints.extractionTemplates.list,
    { params: { page, pageSize, ...(status === "deleted" ? { status } : {}) } },
  );
  return data;
}

export async function createExtractionTemplate(input: TemplateInput) {
  const { data } = await apiClient.post<{ template: ExtractionTemplate }>(
    endpoints.extractionTemplates.list,
    input,
  );
  return data;
}

export async function updateExtractionTemplate(
  id: string,
  input: Partial<TemplateInput>,
) {
  const { data } = await apiClient.patch<{ template: ExtractionTemplate }>(
    endpoints.extractionTemplates.detail(id),
    input,
  );
  return data;
}

export async function deleteExtractionTemplate(id: string) {
  const { data } = await apiClient.delete<DeleteResponse>(
    endpoints.extractionTemplates.detail(id),
  );
  return data;
}

export async function restoreExtractionTemplate(id: string) {
  const { data } = await apiClient.post<{ template: ExtractionTemplate }>(
    endpoints.extractionTemplates.restore(id),
  );
  return data;
}

export async function permanentlyDeleteExtractionTemplate(id: string) {
  const { data } = await apiClient.delete<DeleteResponse>(
    endpoints.extractionTemplates.permanent(id),
  );
  return data;
}
