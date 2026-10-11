import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

import type {
  IngestQueueFilter,
  IngestResponse,
  IngestStatusPage,
} from "./types";

/**
 * Ingest documents (chunk → embed → store). With `documentIds`, ingests
 * exactly those documents (latest approved extraction content, falling back
 * to the raw file); without, ingests every uningested workspace document.
 */
export async function ingestDocuments(
  documentIds?: string[],
): Promise<IngestResponse> {
  const response = await apiClient.post<IngestResponse>(endpoints.ingest.run, {
    documentIds,
  });
  return response.data;
}

/** Paginated per-document ingest state for the ingestion queue. */
export async function getIngestStatus(
  page: number,
  pageSize: number,
  filter: IngestQueueFilter = "all",
): Promise<IngestStatusPage> {
  const { data } = await apiClient.get<IngestStatusPage>(
    endpoints.ingest.status,
    {
      params: {
        page,
        pageSize,
        ...(filter !== "all" ? { status: filter } : {}),
      },
    },
  );
  return data;
}
