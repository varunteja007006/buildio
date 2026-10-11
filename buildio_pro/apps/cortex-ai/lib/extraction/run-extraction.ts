import {
  generateText,
  type FilePart,
  type ModelMessage,
  type TextPart,
} from "ai";

import {
  buildDocumentParts,
  loadDocumentFile,
} from "@/lib/extraction/extract-text";
import { getDefaultExtractionModel } from "@/lib/extraction/model-config";

export type TemplateSnapshot = {
  name?: string;
  instructions: string;
  outputSchema?: unknown;
};

export type ExtractionResult = {
  rawOutput: string;
  model: string;
  provider: string | null;
  usage: Record<string, unknown> | null;
  /** Parsed structured output when the template defines a schema. */
  structuredOutput: unknown;
  structuredError: string | null;
};

/** Split a gateway model id (`provider/model`) into its provider part. */
function providerFromModelId(model: string): string | null {
  const slash = model.indexOf("/");
  return slash > 0 ? model.slice(0, slash) : null;
}

/** Build the extraction instruction message from the template snapshot. */
export function buildExtractionMessages(
  template: TemplateSnapshot,
  documentParts: (TextPart | FilePart)[],
): ModelMessage[] {
  const header = [
    "You are a document extraction assistant.",
    template.name ? `Template: ${template.name}` : null,
    "Instructions:",
    template.instructions,
  ]
    .filter(Boolean)
    .join("\n");

  const hasSchema = template.outputSchema != null;
  const outputDirective = hasSchema
    ? [
        "Return a single JSON object that conforms to this JSON schema:",
        JSON.stringify(template.outputSchema),
        "Return ONLY the JSON object with no surrounding prose or code fences.",
      ].join("\n")
    : "Return the extracted content as clean, readable text or markdown.";

  return [
    {
      role: "user" as const,
      content: [
        { type: "text", text: `${header}\n\n${outputDirective}` },
        ...documentParts,
      ],
    },
  ];
}

/** Try to parse structured output when the template defines a schema. */
function parseStructuredOutput(
  rawOutput: string,
  outputSchema: unknown,
): { structuredOutput: unknown; structuredError: string | null } {
  if (outputSchema == null) return { structuredOutput: null, structuredError: null };
  try {
    const start = rawOutput.indexOf("{");
    const end = rawOutput.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object found");
    return {
      structuredOutput: JSON.parse(rawOutput.slice(start, end + 1)),
      structuredError: null,
    };
  } catch (error) {
    return {
      structuredOutput: null,
      structuredError:
        error instanceof Error ? error.message : "Failed to parse JSON output",
    };
  }
}

/**
 * Run an LLM extraction for a document: load the file, build the prompt
 * from the template snapshot, call the gateway model, and capture the raw
 * output plus usage metadata.
 */
export async function runExtraction({
  template,
  filename,
  filepath,
  model: modelOverride,
}: {
  template: TemplateSnapshot;
  filename: string;
  filepath: string;
  model: string | null;
}): Promise<ExtractionResult> {
  const model = modelOverride ?? getDefaultExtractionModel(filename);
  const file = await loadDocumentFile(filename, filepath);
  const messages = buildExtractionMessages(template, buildDocumentParts(file));

  const result = await generateText({
    model,
    messages,
  });

  const rawOutput = result.text.trim();
  if (!rawOutput) {
    throw new Error("Model returned an empty response");
  }

  const usage = result.usage
    ? (result.usage as unknown as Record<string, unknown>)
    : null;

  return {
    rawOutput,
    model,
    provider: providerFromModelId(model),
    usage,
    ...parseStructuredOutput(rawOutput, template.outputSchema),
  };
}
