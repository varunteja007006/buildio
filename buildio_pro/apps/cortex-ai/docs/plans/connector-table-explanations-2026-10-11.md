# Rename-safe connector table explanations - cortex-ai

**Date:** 2026-10-11
**Status:** In progress; Steps 1-5 and the generation integration of Step 6 are
implemented. Remaining: Step 6 server-side app-ID resolution/renewed
confirmation, Step 7 manual and negative-path verification, rollout.
**Parent:** `database-connector-semantic-context-2026-09-27.md`
**Goal:** Save workspace-owned explanations for individual tables/collections,
preserve them through ordinary renames, and use them when generating AI context.

## Accepted decisions and scope

- Store explanations exclusively in the app DB, including for writable connectors.
- Keep discovered database comments separate from user-authored explanations.
- Reference a stable app table ID, not a schema/name string.
- Track native source identity where available, scoped to a connector/source epoch.
- Preserve context on confirmed renames; require review when identity is uncertain.
- Never infer permission from an explanation or automatically transfer access policy.
- Support the existing Postgres and MongoDB connector flows. Do not add new drivers.
- Reuse the parent's discovered-table and table-context records; no parallel model.
- This slice implements table explanations, schema reconciliation, and generation
  integration. Column editors, synonyms, joins, chat binding, and query execution
  remain in the parent plan, not prerequisites for saving table explanations.
- Read/write credentials do not enable write tools. Existing generation/sampling
  stays read-only; new write tools and writing database comments are out of scope.

## Current implementation and touchpoints

- `lib/db/schema/connections.ts`: connector explanation in `connections.description`.
- `lib/connectors/schema.ts`: live Postgres objects and MongoDB collection names;
  no persisted table IDs or native source IDs yet.
- `lib/connectors/table-metadata.ts`: live Postgres column/storage/index details.
- `lib/connectors/description-metadata.ts` and `generate-description.ts`: metadata
  discovery, confirmed selections, and optional samples for connector generation.
- `components/pages/connector-table-browser.tsx` and `connector-table-details.tsx`:
  table selection and physical metadata UI.
- `api/connections/` and `api/endpoints.ts`: typed client data layer.
- `app/api/connections/[id]/`: authorized connector routes to extend.

## Step 1 - Define identity and lifecycle rules

- [x] Define a normalized discovery record: source ID if available, schema/name,
      object type, database comment, and a bounded structural fingerprint.
      Implemented in `lib/connectors/schema-sync/identity.ts` (`DiscoveryRecord`)
      with the full identity/lifecycle rule contract documented in the module.
- [x] Use PostgreSQL `pg_class.oid` for ordinary table renames/schema moves. Capture
      column attributes needed for drift review; do not treat a fingerprint as identity.
- [x] Inspect MongoDB collection UUID availability using `listCollections` without
      `nameOnly`; handle restricted metadata privileges and name-only fallback explicitly.
- [x] Scope native identity to `connectionId + sourceEpoch`; native IDs are not
      globally unique or guaranteed to survive restore/drop-recreate.
- [x] Advance the source epoch when the connector target changes or a user declares
      a restore/replacement. Credential-only edits do not reset identity by themselves.
      Target-change detection hashes the type/host/port/database/file descriptor and
      compares against the last successful sync (`buildTargetDescriptorHash`).
- [x] Document that endpoint/database checks cannot reliably detect every restore,
      transparent source replacement, or OID reuse; uncertain continuity requires review.
- [x] Specify statuses: active, removed, and needs-review; removed/needs-review
      objects cannot be used by execution tools.
- [x] Specify that same name plus different native ID is a new object, not a rename.
- [x] For name-only sources, unchanged names are best-effort continuity, not proof;
      disappeared/new names require explicit relinking rather than automatic matching.

## Step 2 - Add app DB persistence and apply the migration

- [x] Add `sourceEpoch` to connections and implement target-change detection.
- [x] Add `connector_schema_syncs`: workspace/connection, epoch, status, timestamps,
      bounded summary, and sanitized error. Sync history is immutable after completion.
- [x] Add `connector_tables`: app UUID, workspace/connection/epoch, native source ID,
      schema/name/type, database comment, fingerprint, last-seen sync, drift/review state,
      `removedAt`, and timestamps.
- [x] Add `connector_table_contexts`: table ID (one-to-one), workspace/connection,
      explanation, revision, edited-by, and timestamps. Reuse parent policy fields when
      implemented; new/disputed objects remain disabled by default.
- [x] Add same-workspace/connection foreign-key constraints where practical and
      validate these relationships in the service layer on every operation.
- [x] Use active-only unique indexes for source identity and qualified name within
      an epoch so historical/removed rows do not block replacements or name reuse.
- [x] Define connector lifecycle: soft deletion blocks all child access, restore
      preserves context but requires a successful reconciliation before tool use, and
      explicit permanent deletion uses the existing authorized connector flow.
- [x] Clearing an explanation updates context; do not introduce a table-delete API.
      Missing source objects retain their context in a reachable removed/review view.
- [x] Export schema modules and generate with `pnpm --filter=cortex-ai db:generate`.
- [x] Review SQL, declare the target app database, then apply with
      `pnpm --filter=cortex-ai db:migrate`; never migrate the external connector DB.
- [x] Verify the migration is applied before routes read the new tables.

## Step 3 - Implement bounded discovery and reconciliation

Implemented in `lib/connectors/schema-sync/snapshot.ts` (bounded complete
snapshots), `reconcile.ts` (lock, epoch decision, sanitized failures), and
`apply.ts` (transactional reconciliation).

- [x] Reuse existing drivers and catalog queries rather than add an adapter framework.
- [x] Align browsing/generation discovery scopes and limits; intentionally excluded
      schemas or types must not be accidentally marked removed.
- [x] Read metadata only, respecting source permissions, timeouts, object/byte caps,
      cancellation, host checks, and guaranteed client cleanup. Postgres uses
      `statement_timeout` plus per-query bounds; work is bounded rather than
      race-cancelled.
- [x] Obtain a per-connector sync lock; reject overlapping refreshes. Capture epoch
      and target version so a refresh cannot commit after a connector target edit
      (unique partial index on running syncs + in-transaction `FOR UPDATE` re-check).
- [x] Collect a complete snapshot before mutating app metadata. A failed, truncated,
      or permission-reduced snapshot must not mass-mark tables removed.
- [x] Distinguish proven deletion from loss of metadata visibility; uncertain missing
      objects are unavailable/needs-review until visibility is restored or reviewed.
      Postgres: absent OIDs are proven dropped (`pg_class` recheck distinguishes
      out-of-scope objects); MongoDB name-only fallbacks become needs-review.
- [x] Transactionally update matching active source IDs, including renamed schemas/
      tables, while preserving app IDs, explanations, and user edits.
- [x] Record structural drift and require re-review for changes affecting safety;
      never enable new columns or transfer old policy silently (fingerprint change
      sets `needs-review` / `structure_changed`).
- [x] Insert unmatched discoveries as new disabled records and retain missing context.
      Do not resurrect historical IDs automatically after an observed disappearance.
- [x] On changed epoch, preserve old records for review and discover a fresh set.
- [x] Commit metadata and the sync result together; failed syncs preserve the last
      successful snapshot and display its stale/unavailable state explicitly.
- [x] First rollout uses explicit Refresh schema; existing connector explanations
      remain unchanged and no background job or row sampling is introduced.

## Step 4 - Add authorized APIs and client data access

Routes live under `app/api/connections/[id]/schema/`; contracts in
`api/connections/schema-contracts.ts`; typed endpoints/fetchers/hooks in
`api/connections/`.

- [x] Implement `GET /api/connections/:id/schema` with active/removed/review filters,
      search, capped pagination, stable ordering, and page/pageSize/total/pageCount.
- [x] Implement `POST /api/connections/:id/schema/refresh` returning sync/drift state.
- [x] Implement `GET /api/connections/:id/schema/tables/:tableId` combining discovered
      metadata, context, revision, and review status. Resolve live details server-side.
- [x] Implement `PATCH /api/connections/:id/schema/tables/:tableId/context` with a
      trimmed explanation (maximum 8,000 characters), unknown-field rejection, and
      expected revision; return a conflict rather than overwrite another user's edit.
- [x] Implement `POST /api/connections/:id/schema/tables/:tableId/relink` accepting
      a same-connector active destination ID and explicit confirmation.
- [x] Relink transactionally: move explanation only, preserve the historical source
      record, reject destination-context conflicts, and require separate policy review.
      Never silently overwrite a destination explanation or copy execution permissions.
- [x] Authorize user/workspace membership, active connector, and every nested ID;
      reject cross-workspace, cross-connection, and stale-epoch operations.
- [x] Add shared Zod contracts, typed endpoints, fetchers, table-ID query keys, and
      focused invalidation for save, relink, refresh, and target change.
- [x] Migrate internal callers from name-based IDs; retire redundant live list routes
      once callers are migrated, retaining bounded live physical details where needed
      (`/tables` and `/tables/detail` removed; live physical details now resolve inside
      the table-detail route).

## Step 5 - Deliver the table explanation and drift UI

Implemented across `connector-schema-refresh.tsx`, `connector-table-browser.tsx`
(id-based, server-paginated), `connector-table-details.tsx`,
`table-explanation-editor.tsx`, `table-relink-dialog.tsx`, and
`connector-table-physical-details.tsx`; hosted by `agent-connector-detail.tsx`.

- [x] Add Refresh schema, last successful refresh, stale state, and drift summary.
- [x] Preserve existing browser filters and physical metadata; select tables by app ID.
- [x] Show a first-sync prompt, empty/loading/error states, and explanation indicators.
- [x] Add a separate explanation editor to selected-table details with Save, Cancel,
      character count, loading/error feedback, and revision-conflict handling.
- [x] Show the source database comment separately; saving writes only to the app DB.
- [x] Protect dirty editor drafts on table selection, refresh, navigation, and relink
      (selection guard + `beforeunload`; refreshes never alter explanations, so drafts
      survive reconciliation).
- [x] Add a reachable Removed / Needs review view retaining historical names/context.
- [x] Add a user-confirmed relink action with old/new schema and structural comparison,
      context-conflict warnings, and a clear notice that policy is not transferred.
- [x] Reuse `@workspace/ui` components, dialog portal containers, constrained scroll
      layouts, and accessible labels; keep code files below the 250-line lint limit.
- [ ] Verify both read-only and writable connector accounts can save explanations
      without any external `UPDATE`, `COMMENT ON`, or DDL privilege.

## Step 6 - Consume explanations in generation and tools

- [x] Extend existing connector-generation preview and confirmed payload with saved
      explanations for selected active tables; disclose these as additional AI context
      (`loadTableExplanations`, activity `explanationCount`, dialog disclosure).
- [ ] Resolve confirmed app table IDs server-side against current epoch/sync/revision;
      require renewed confirmation when the approved context materially changes.
      (Currently explanations attach by name at generation time from active rows only.)
- [x] Build bounded context from connector explanation, current physical metadata,
      source comments, and saved table explanations without copying them into each other.
- [x] Treat descriptions/comments as untrusted context, never executable instructions
      or authorization; server-enforced policy remains authoritative.
- [x] Reuse existing sample consent, sensitive-column checks, caps, activity reporting,
      cancellation, and unsaved-draft behavior. Refresh never samples table rows.
- [ ] Verify a saved table explanation actually reaches the confirmed generation
      request; removed, disputed, unauthorized, and unselected explanations do not.
- [ ] Provide the same authorized context assembly to the parent's future
      `listDatabaseTables` / `describeDatabaseTable` tools; use current server-resolved
      names at execution, never names cached in generated text/tool definitions.
- [x] Invalidate any existing generated-context cache on edits, drift, relink, or
      epoch change; do not build a new cache/versioning system just for this feature.
      (No generated-context cache exists and none was added.)

## Step 7 - Verify and roll out

Runnable checks: `cd apps/cortex-ai && pnpm exec tsx scripts/checks/schema-sync-checks.ts`
(exercises the real Postgres fixture from `docker-compose.yml`).

- [x] Add runnable reconciliation checks using the installed `tsx` and Node assertions;
      cover unchanged refresh, rename/schema move, removal, drop/recreate, name reuse,
      epoch reset, identity fallback, visibility loss, and destination-context conflict.
      (16 checks pass; destination-context conflict is covered by explicit route
      validation and needs a route-level test during manual verification.)
- [x] Extend the existing Postgres fixture and manually verify real catalog identity
      across `ALTER TABLE RENAME` / schema moves; use an authorized development fixture.
      (Automated against the compose fixture with real catalog OIDs.)
- [ ] Check MongoDB UUID and name-only behavior against available test credentials.
- [ ] Verify read-only accounts can discover and annotate; no source writes occur.
- [ ] Verify cross-workspace/connection IDs, removed connectors, unknown fields,
      oversized text, stale revisions, and relink policy transfer are rejected.
- [ ] Recover from a stale running sync after a mid-refresh crash: today the row
      stays `status='running'` forever and every refresh returns
      `refresh_already_running`; add stale-lock detection/cleanup and cover it in
      the reconciliation checks.
- [ ] Decide and implement needs-review reversion rules: `apply.ts` currently
      flips a `needs-review` row back to `active` when the fingerprint matches
      again on the next refresh, without human review, contradicting the
      "unavailable until reviewed" contract in `identity.ts`.
- [ ] Verify refresh concurrency, refresh-versus-target-edit races, timeout cleanup,
      failed snapshot preservation, and save-versus-refresh behavior.
- [ ] Verify generated context matches consent and excludes credentials/sample logs.
- [ ] Manually verify persistence after reload, dirty draft protection, historical
      context, relink, connector trash/restore, and responsive keyboard-accessible UI.
- [x] Run `pnpm --filter=cortex-ai typecheck`, focused lint, and `pnpm build:cortex-ai`;
      distinguish pre-existing failures from this feature's failures. (All pass.)
- [ ] Roll out to a development connector first, then migrate the intended production
      app DB with explicit authorization. Monitor sanitized sync failures/conflicts.
- [ ] Complete this checklist and matching parent todos only after checks pass; move
      this plan to `docs/plans/done/` and mark its index entry `✅`.

## Definition of done

- Explanations save/load for individual tables on read-only and writable connectors.
- Ordinary native-ID-preserving renames retain the same explanation and app ID.
- Uncertain replacements never silently inherit context or execution permissions.
- Missing objects retain recoverable context but cannot be used by execution tools.
- Refresh cannot overwrite explanations or interpret partial discovery as deletion.
- Generation demonstrably uses only authorized, selected, confirmed table context.
- Migration, negative authorization checks, reconciliation checks, and UI checks pass.
