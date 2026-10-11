"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { documentKeys } from "@/api/documents/query";
import { extractionKeys } from "@/api/extractions/query";

import { getIngestStatus, ingestDocuments } from "./api";
import type { IngestQueueFilter, IngestResponse } from "./types";

export const ingestKeys = {
  all: ["ingest"] as const,
  status: (page: number, pageSize: number, filter: IngestQueueFilter) =>
    ["ingest", "status", page, pageSize, filter] as const,
};

export function useIngestStatus(
  page: number,
  pageSize: number,
  filter: IngestQueueFilter = "all",
) {
  return useQuery({
    queryKey: ingestKeys.status(page, pageSize, filter),
    queryFn: () => getIngestStatus(page, pageSize, filter),
  });
}

function summarize(result: IngestResponse): string {
  const results = result.results ?? [];
  const chunks = results.reduce((sum, r) => sum + (r.chunksCount ?? 0), 0);
  const ingested = result.ingested ?? 0;
  const base = ingested === 1 ? "1 document" : `${ingested} documents`;
  return chunks > 0 ? `${base} • ${chunks} chunks` : base;
}

/**
 * Ingest documents (chunk → embed → store). Pass `{ documentIds }` for
 * specific documents; omit for every uningested workspace document.
 * Raises chunk-count / failure toasts (E6) and refreshes document,
 * resource, extraction, and ingestion-queue state.
 */
export function useIngestDocuments() {
  const queryClient = useQueryClient();

  return useMutation<IngestResponse, Error, { documentIds?: string[] } | void>({
    mutationFn: (vars) => ingestDocuments(vars?.documentIds),
    onSuccess: (data) => {
      const results = data.results ?? [];
      const failures = results.filter((r) => !r.success);
      const firstFailure = failures[0];

      if (failures.length === 0) {
        toast.success(`Ingested ${summarize(data)}`);
      } else if ((data.ingested ?? 0) > 0) {
        toast.warning(`Ingested ${summarize(data)}`, {
          description: firstFailure
            ? `${failures.length} failed: "${firstFailure.filename}" — ${firstFailure.error}`
            : `${failures.length} failed.`,
        });
      } else {
        toast.error("Ingestion failed", {
          description: firstFailure
            ? `"${firstFailure.filename}" — ${firstFailure.error}`
            : "Unknown error.",
        });
      }

      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: extractionKeys.all });
      queryClient.invalidateQueries({ queryKey: ingestKeys.all });
    },
    onError: (error) => {
      toast.error(`Ingestion failed: ${error.message}`);
    },
  });
}
