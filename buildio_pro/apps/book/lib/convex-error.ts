import { ConvexError } from "convex/values";

const GENERIC_ERROR_MESSAGE = "Something went wrong";

/**
 * Returns a human-readable message for a failed Convex mutation. ConvexError
 * data is the clean server message; other errors carry Convex wrapper text
 * (e.g. "... Server Error Uncaught Error: <message> at handler ...") which is
 * stripped down to the underlying message.
 */
export function getConvexErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    return typeof error.data === "string" && error.data.length > 0
      ? error.data
      : GENERIC_ERROR_MESSAGE;
  }
  const raw = error instanceof Error ? error.message : String(error);
  const match = raw.match(
    /Uncaught Error: (.+?)(?: at handler| Called by client|$)/,
  );
  const message = match?.[1];
  if (message === undefined || message.length === 0) {
    return raw.length > 0 ? raw : GENERIC_ERROR_MESSAGE;
  }
  return message;
}
