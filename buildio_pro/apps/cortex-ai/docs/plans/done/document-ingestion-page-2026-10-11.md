# Document ingestion page (2026-10-11)

Goal: a `/dashboard/documents/ingestion` monitoring/orchestration page over the
existing ingest pipeline (mirroring the extraction-templates page pattern),
replacing the unlinked `ingest-docs` placeholder stub.

Ingestion backend already exists (`POST /api/ingest`, `lib/ingest/ingest-document.ts`,
per-row ingest button, error badge, bulk bar). State lives on
`documents.ingested` / `documents.lastIngestError`, output on `resources` +
`embeddings`. Current chunking: fixed-size character windows (1000 chars, 200
overlap) with paragraph/sentence boundary refinement.

## Design

Single queue view (row click opens a stats dialog):

- **Queue**: per-document ingest state — Document, Source (extraction vs raw
  file), Status (Ingested / Pending / Failed with error popover + retry),
  Chunks, Last ingested; stats strip (`pending · failed · ingested`), status
  filter, "Ingest all" action.
- **Row click** → `IngestStatsDialog` (deep-linkable via `?ingest=<id>`):
  status, chunks, content length, last ingested, source, content preview,
  ingest error, and Ingest/Retry/Re-ingest action. Data comes from the queue
  row — no extra fetch. (Originally there was a second "Ingested content"
  resources toggle; removed in favour of the dialog.)

## Backend

- [x] B1 `GET /api/ingest/status` — paginated active documents with ingest
      state, joined active-resource chunk count + content preview/length,
      approved-extraction presence, and a `stats` aggregate (`pending` /
      `failed` / `ingested`). Filters: `all | pending | failed | ingested`.
      Response follows the `{ items, total, page, pageSize, pageCount }`
      pattern.

## Client data layer

- [x] C1 Register `ingest.status` in `api/endpoints.ts`.
- [x] C2 `api/ingest/types.ts`: `IngestStatusRow`, `IngestStats`,
      `IngestStatusPage`.
- [x] C3 `api/ingest/api.ts`: `getIngestStatus`.
- [x] C4 `api/ingest/query.ts`: query keys + `useIngestStatus`;
      `useIngestDocuments` invalidates ingest keys.

## UI

- [x] U1 `components/pages/ingestion.tsx` (PageHeader) +
      `app/(authenticated)/dashboard/documents/ingestion/page.tsx`.
- [x] U2 Queue section: stats strip, filter toggles, "Ingest all" button,
      paginated DataTable.
- [x] U3 Queue columns: Document, Source, Status (reuse
      `DocumentIngestErrorBadge` for failures), Chunks, Last ingested,
      Ingest action (reuse `DocumentIngestButton`).
- [x] U4 `IngestStatsDialog` on queue-row click.
- [x] U5 Sidebar: add "Ingestion" to the Documents group.
- [x] U6 Remove the `ingest-docs` placeholder stub (superseded by this page).

## Verification

- [x] V1 `pnpm --filter=cortex-ai typecheck` and `pnpm --filter=cortex-ai lint`.
