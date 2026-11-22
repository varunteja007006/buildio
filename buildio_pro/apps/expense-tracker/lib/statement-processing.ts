// Give synchronous extraction time to finish before another request can retry it.
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;

export function statementProcessingCutoff(now = Date.now()) {
  return new Date(now - PROCESSING_TIMEOUT_MS);
}
