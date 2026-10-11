import { z } from "zod";

/** Maximum length of a user-authored table explanation (matches plan). */
export const TABLE_EXPLANATION_MAX_LENGTH = 8000;

/** Maximum length of a connector-level explanation (server, UI, and AI generation). */
export const CONNECTOR_DESCRIPTION_MAX_LENGTH = 8000;

export const schemaListQuerySchema = z.object({
  status: z
    .enum(["active", "removed", "needs-review", "all"])
    .default("active"),
  search: z.string().max(200).optional(),
  schema: z.string().max(200).optional(),
  objectType: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const schemaRefreshInputSchema = z.strictObject({
  declareReplacement: z.boolean().optional(),
});

export const tableContextInputSchema = z.strictObject({
  explanation: z.string().max(TABLE_EXPLANATION_MAX_LENGTH),
  /** 0 means "no context exists yet"; conflicts return 409, never overwrite. */
  expectedRevision: z.number().int().min(0),
});

export const tableRelinkInputSchema = z.strictObject({
  destinationTableId: z.string().min(1),
  confirm: z.literal(true),
});
