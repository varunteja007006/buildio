# Chat document attachments

## TODOs

- [x] Add dashboard-chat document picker with per-message limits and file chips.
- [x] Upload authorized files directly to the S3-compatible bucket.
- [x] Persist attachment references with chat messages and show them in history.
- [x] Include stored PDF/text content in model requests, including follow-up turns.
- [x] Enforce the same file count, size, and type restrictions on the server.

Limits: 3 files per message, 10 MiB per file, 20 MiB total. Supported: PDF, TXT,
MD/MDX, and CSV. Agent playground chats remain unchanged.
