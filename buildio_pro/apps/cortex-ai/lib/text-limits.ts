/**
 * Shared maximum lengths for user-authored text fields. API routes and the
 * dialogs that submit to them both read these limits so they stay in sync.
 */

/** Short names and titles: agents, toolboxes, templates, topics, folders, workspaces, thread titles. */
export const NAME_MAX_LENGTH = 150;

/** Optional short descriptions. */
export const DESCRIPTION_MAX_LENGTH = 2_000;

/** Long-form free text: agent instructions, template bodies, extraction instructions. */
export const INSTRUCTIONS_MAX_LENGTH = 8_000;

/** Extraction template output JSON schema (serialized text). */
export const OUTPUT_SCHEMA_MAX_LENGTH = 16_000;

/** Optional free-text feedback comments (aligned with chat feedback). */
export const FEEDBACK_COMMENT_MAX_LENGTH = 1_000;

/** Extraction review content edits. */
export const EXTRACTION_CONTENT_MAX_LENGTH = 200_000;

type TextField = {
  label: string;
  /** Value to check; null/undefined means "not provided" and is skipped. */
  value: string | null | undefined;
  maxLength: number;
};

/**
 * Returns an error message for the first text field over its maximum length,
 * or null when every provided field is within its limit.
 */
export function findTextLengthError(fields: readonly TextField[]): string | null {
  for (const field of fields) {
    if (field.value && field.value.length > field.maxLength)
      return `${field.label} must be at most ${field.maxLength} characters`;
  }
  return null;
}
