import {
  getPostgresConnector,
  inspectPostgresMetadata,
} from "@/lib/connectors/description-metadata";
import { generateConnectorDescription } from "@/lib/connectors/description-model";
import {
  failureMessage,
  type SampleSummary,
  streamEvent,
} from "@/lib/connectors/description-stream";
import { collectApprovedSamples } from "@/lib/connectors/generate-description-samples";
import { loadTableExplanations } from "@/lib/connectors/table-explanations";

const MAX_METADATA_BYTES = 128 * 1024;
const SAMPLE_TABLES_PER_RUN = 5;

type GenerateInput = {
  connectionId: string;
  workspaceId: string;
  connectionType: string;
  database: string | null;
  metadataTables: { schema: string; table: string }[];
  includeSamples: boolean;
  samples: { schema: string; table: string; columns: string[] }[];
  signal: AbortSignal;
};

export function streamConnectorDescription(input: GenerateInput) {
  const {
    connectionId,
    workspaceId,
    connectionType,
    database,
    metadataTables: requestedTables,
    includeSamples,
    samples: requestedSamples,
    signal,
  } = input;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let streamClosed = false;
      const send = (event: Record<string, unknown>) => {
        if (streamClosed) return;
        try {
          streamEvent(controller, event);
        } catch {
          streamClosed = true;
        }
      };
      let active: Record<string, unknown> | null = null;
      const sampleSummary: SampleSummary[] = [];
      let samplesIncludedInAiRequest = false;
      let explanationsIncluded = 0;
      void (async () => {
        try {
          send({
            type: "status",
            status: "inspecting",
            message: "Inspecting schema metadata",
          });
          const config = await getPostgresConnector(connectionId, workspaceId);
          active = { tool: "inspectPostgresMetadata" };
          send({
            type: "activity",
            status: "running",
            tool: "inspectPostgresMetadata",
          });
          const metadata = await inspectPostgresMetadata(config);
          const explanations = await loadTableExplanations(
            connectionId,
            workspaceId,
          );
          send({
            type: "activity",
            status: "completed",
            tool: "inspectPostgresMetadata",
            tableCount: metadata.tables.length,
            columnCount: metadata.tables.reduce(
              (count, table) => count + table.columns.length,
              0,
            ),
          });
          active = null;
          const metadataKeys = new Set<string>();
          const selectedMetadata = requestedTables.map((selection) => {
            const key = `${selection.schema}\0${selection.table}`;
            if (metadataKeys.has(key))
              throw new Error("Select each metadata table only once");
            metadataKeys.add(key);
            const table = metadata.tables.find(
              (candidate) =>
                candidate.schema === selection.schema &&
                candidate.name === selection.table,
            );
            if (!table)
              throw new Error(
                "Selected metadata table is not in this connector schema",
              );
            const explanation = explanations.get(key) ?? null;
            if (explanation) explanationsIncluded += 1;
            return {
              ...table,
              explanation,
              relationships: table.relationships.filter((relationship) =>
                requestedTables.some(
                  (candidate) =>
                    candidate.schema === relationship.referencedSchema &&
                    candidate.table === relationship.referencedTable,
                ),
              ),
            };
          });
          send({
            type: "activity",
            status: "confirmed",
            tool: "metadataSentToAI",
            tables: selectedMetadata.map(({ schema, name, columns, explanation }) => ({
              schema,
              table: name,
              columns: columns.map(({ name: column }) => column),
              explanationIncluded: explanation != null,
            })),
            explanationCount: explanationsIncluded,
          });
          const checkedSamples = includeSamples
            ? requestedSamples.slice(0, SAMPLE_TABLES_PER_RUN)
            : [];
          if (
            Buffer.byteLength(JSON.stringify(selectedMetadata)) >
            MAX_METADATA_BYTES
          )
            throw new Error(
              "Selected schema metadata exceeds the 128 KB limit; select fewer tables",
            );

          const { sampleContext, sampleSummary: runSampleSummary } =
            await collectApprovedSamples({
              config,
              metadata,
              checkedSamples,
              metadataKeys,
              signal,
              setActive: (value) => {
                active = value;
              },
              send,
            });
          sampleSummary.push(...runSampleSummary);

          send({
            type: "status",
            status: "generating",
            message: "Generating description",
          });
          active = { tool: "generateConnectorDescription" };
          samplesIncludedInAiRequest = sampleContext.length > 0;
          const description = await generateConnectorDescription(
            metadata,
            selectedMetadata,
            sampleContext,
            signal,
          );
          active = null;
          send({
            type: "complete",
            description,
            summary: {
              connectorType: connectionType,
              database: database,
              metadata: {
                tableCount: selectedMetadata.length,
                explanationCount: explanationsIncluded,
                columnCount: selectedMetadata.reduce(
                  (count, table) => count + table.columns.length,
                  0,
                ),
                tables: selectedMetadata.map(({ schema, name, columns }) => ({
                  schema,
                  table: name,
                  columns: columns.map(({ name: column }) => column),
                })),
              },
              samples: sampleContext.map(
                ({ schema, table, columns, rows }) => ({
                  schema,
                  table,
                  columns,
                  rowCount: rows.length,
                }),
              ),
              samplesIncludedInAiRequest,
            },
          });
        } catch (error) {
          if (active) send({ type: "activity", status: "failed", ...active });
          send({
            type: "error",
            error: failureMessage(error, signal.aborted),
            samples: sampleSummary,
            samplesIncludedInAiRequest,
          });
        } finally {
          if (!streamClosed) {
            try {
              controller.close();
            } catch {
              streamClosed = true;
            }
          }
        }
      })();
    },
  });

  return stream;
}
