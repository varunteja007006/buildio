// Convex server errors arrive as multi-line noise around the real message:
// "[CONVEX M(fn)] [Request ID: ...] Server Error\nUncaught Error: <msg>\n at handler (...)".
// Extract just the human-readable message for toasts.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  // Prefer the text after "Uncaught Error:" when present.
  const [, uncaught = error.message] = error.message.split("Uncaught Error:");
  const [firstLine = error.message] = uncaught.split("\n");
  // Truncate Convex's location suffix (" at handler (...)", " Called by client").
  const cleaned = firstLine
    .replace(/ at handler .*/, "")
    .replace(/ Called by .*/, "")
    .trim();
  return cleaned || fallback;
}
