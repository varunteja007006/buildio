import {
  samplePostgresRows,
  type ConnectorMetadata,
  type SampleSelection,
} from "@/lib/connectors/description-metadata";
import { isLikelySensitiveColumn } from "@/lib/connectors/description-safety";
import type { SampleSummary } from "@/lib/connectors/description-stream";
import type { ServerProbeConfig } from "@/lib/connectors/probe";

export type ApprovedSampleContext = {
  schema: string;
  table: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

/**
 * Run the user's explicitly approved sample queries with per-run/per-query
 * caps and sensitive-column exclusion, emitting activity events as it goes.
 */
export async function collectApprovedSamples(args: {
  config: ServerProbeConfig;
  metadata: ConnectorMetadata;
  checkedSamples: SampleSelection[];
  metadataKeys: Set<string>;
  signal: AbortSignal;
  setActive: (active: Record<string, unknown> | null) => void;
  send: (event: Record<string, unknown>) => void;
}): Promise<{
  sampleContext: ApprovedSampleContext[];
  sampleSummary: SampleSummary[];
}> {
  const {
    config,
    metadata,
    checkedSamples,
    metadataKeys,
    signal,
    setActive,
    send,
  } = args;
  const sampleContext: ApprovedSampleContext[] = [];
  const sampleSummary: SampleSummary[] = [];
  const seen = new Set<string>();
  for (const selection of checkedSamples) {
    if (signal.aborted) throw new Error("Generation cancelled");
    const key = `${selection.schema}\u0000${selection.table}`;
    if (seen.has(key)) throw new Error("Select each table only once");
    seen.add(key);
    const table = metadata.tables.find(
      (candidate) =>
        candidate.schema === selection.schema &&
        candidate.name === selection.table,
    );
    if (!table)
      throw new Error("Selected table is not in this connector schema");
    if (!metadataKeys.has(key))
      throw new Error("Sample tables must also be selected for metadata");
    for (const column of selection.columns) {
      if (!table.columns.some((candidate) => candidate.name === column))
        throw new Error("Selected column is not in this connector schema");
      if (isLikelySensitiveColumn(column))
        throw new Error("Likely sensitive columns cannot be sampled");
    }
    setActive({
      tool: "sampleDatabaseRows",
      schema: selection.schema,
      table: selection.table,
      columns: selection.columns,
    });
    send({
      type: "activity",
      status: "running",
      tool: "sampleDatabaseRows",
      schema: selection.schema,
      table: selection.table,
      columns: selection.columns,
    });
    const rows = await samplePostgresRows(config, selection, signal);
    if (rows.length > 5)
      throw new Error("Sample query exceeded the 5-row limit");
    sampleSummary.push({
      schema: selection.schema,
      table: selection.table,
      columns: selection.columns,
      rowCount: rows.length,
    });
    sampleContext.push({
      schema: selection.schema,
      table: selection.table,
      columns: selection.columns,
      rows,
    });
    send({
      type: "activity",
      status: "completed",
      tool: "sampleDatabaseRows",
      schema: selection.schema,
      table: selection.table,
      columns: selection.columns,
      rowCount: rows.length,
    });
    setActive(null);
  }
  return { sampleContext, sampleSummary };
}
