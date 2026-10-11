export type ExtractionTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  instructions: string;
  outputSchema: unknown;
  defaultModel: string | null;
  createdBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplatePage = {
  templates: ExtractionTemplate[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type TemplateInput = {
  name: string;
  description?: string;
  instructions: string;
  outputSchema?: unknown;
  defaultModel?: string;
};

export type TemplateSuggestion = {
  name: string;
  description: string;
  instructions: string;
  outputSchema: Record<string, unknown> | null;
};

export type DeleteResponse = { success: boolean; id: string };
