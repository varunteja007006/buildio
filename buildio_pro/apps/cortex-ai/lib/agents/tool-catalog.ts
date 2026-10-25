export type ToolCatalogEntry = {
  key: string;
  name: string;
  description: string;
};

/**
 * Server-defined catalog of tools an agent can attach. Tool implementations
 * live with the chat route; this registry governs which keys are attachable
 * to agents and toolboxes. Connector-scoped tools are added here as they
 * ship. The knowledge-base tools (`getInformation`, `addResource`) were
 * removed; no tools are currently attachable.
 */
export const toolCatalog: ToolCatalogEntry[] = [];

export const TOOL_CATALOG_KEYS = new Set(toolCatalog.map((entry) => entry.key));

export function isValidToolKey(key: string): boolean {
  return TOOL_CATALOG_KEYS.has(key);
}
