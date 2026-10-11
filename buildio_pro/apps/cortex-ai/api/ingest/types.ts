export interface IngestResultItem {
  documentId: string;
  filename: string;
  success: boolean;
  chunksCount?: number;
  /** Where the ingested content came from */
  source?: "extraction" | "file";
  error?: string;
}

export interface IngestResponse {
  success: boolean;
  message?: string;
  ingested?: number;
  failed?: number;
  results?: IngestResultItem[];
  error?: string;
}

export type IngestQueueFilter = "all" | "pending" | "failed" | "ingested";

export type IngestStatusRow = {
  id: string;
  filename: string;
  ingested: boolean;
  lastIngestError: string | null;
  hasApprovedExtraction: boolean;
  chunks: number;
  lastIngestedAt: string | null;
  /** Preview of the active resource's content; null when not ingested. */
  preview: string | null;
  contentLength: number | null;
};

export type IngestStats = {
  pending: number;
  failed: number;
  ingested: number;
};

export type IngestStatusPage = {
  items: IngestStatusRow[];
  stats: IngestStats;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
