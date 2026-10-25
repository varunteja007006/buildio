# Agent Builder Plan - cortex-ai

**Date:** 2026-09-27
**Status:** In progress
**Depends on:** existing topics, documents/RAG pipeline, and chat streaming stack
**Scope:** Workspace agent CRUD with topics, tools, toolboxes, reusable
instruction templates, chat playground, deploy lifecycle, and feedback

## Goal

Let a workspace member build, test, and run AI agents. An agent combines:

1. A name and description.
2. Attached topics that scope retrieval to the agent's knowledge slice.
3. Attached tools, either individually or through a reusable Toolbox.
4. Instructions, free-form or instantiated from a reusable instruction template.

The lifecycle is draft → playground → deployed, and undeploy reverses it. Every
agent and chat exchange can receive feedback so builders can iterate.

## Current baseline

- `/dashboard/agent/builder` is a placeholder page (breadcrumb + empty state).
- The sidebar already has an Agent section with Builder and Connectors items.
- Topics exist with workspace-scoped CRUD, soft delete with `deletedBatchId`
  cascades, and a capped (not paginated) list endpoint.
- Chat (`app/api/chat/route.ts`) streams via the AI SDK with a guardrail scan,
  workspace-wide embedding retrieval (`findRelevantContent`), and resource tools.
  Threads are scoped to `userId + workspaceId` only; there is no agent binding.
- Extraction templates demonstrate the target patterns: paginated list with
  `?status=deleted`, soft-delete/restore/permanent routes, active/deleted tabs,
  dialog with fixed header/footer, and a columns file split for the 250-line
  ESLint limit.
- No tools registry, toolbox, agent, instruction template, or feedback concept
  exists anywhere in the app.

## Product decisions

- **Agent instructions are copied, not referenced:** applying an instruction
  template copies its text into the agent. Later template edits do not mutate
  existing agents.
- **Deploy requires a playground test-run:** an agent cannot move
  draft → deployed until a playground chat has been exercised against it. The
  deploy endpoint validates this server-side.
- **Toolbox exclusion rules (edge cases):**
  - A tool already inside any toolbox is not shown as an individually
    attachable tool in the agent tool picker.
  - Attaching a toolbox to an agent removes overlapping individually attached
    tools from that agent.
  - The server enforces both rules on attach; the client mirrors them in the
    picker so list state and selection state can never disagree.
- **Toolbox membership is validated on agent runs:** a toolbox that was deleted
  or lost a tool after attachment silently stops contributing that tool; agent
  runs resolve tools at request time from active rows only.
- **Feedback at two levels:** per-agent feedback (rating + comment) and
  per-chat-message feedback (thumbs up/down + optional comment). Message
  feedback aggregates into the agent detail view because agent playground chats
  belong to the agent.
- **Soft delete everywhere mutable:** agents, toolboxes, templates, and feedback
  follow `deletedAt` + active-read filters + partial unique indexes. Agents and
  toolboxes get restore and owner-authorized permanent-delete routes.
- **Manual body validation** in route handlers matches the existing app style;
  drizzle-zod shared schemas are not introduced in this plan.

## Non-goals

- Running agents outside the playground (no public API, webhooks, or scheduling).
- Multiple agents per chat thread or attaching agents to normal dashboard chats.
- Versioning/revision history for agent configs or templates.
- Sharing agents, toolboxes, or templates across workspaces.
- Custom tool authoring (the tool catalog is server-defined code).
- Analytics dashboards over feedback data beyond a simple aggregate view.

## Data model

All records carry `workspaceId` and are authorized through the authenticated
user's active workspace; ids alone are never sufficient authorization. Ids are
app-generated UUIDs in `text` columns; timestamps are `withTimezone` with
`$onUpdateFn` on `updatedAt`.

- `agents` — `id`, `workspaceId`, `name`, `description`, `instructions`,
  `status` (`draft` | `deployed` | `undeployed`, default `draft`),
  `lastDeployedAt`, `createdBy`, `deletedAt`, timestamps. Partial unique index
  on `(workspaceId, name) WHERE deleted_at IS NULL`; index on `workspaceId`.
- `agent_topics` — `id`, `agentId` (cascade), `topicId` (cascade), timestamps.
  Unique `(agentId, topicId)`. Topic must be active and owned by the agent's
  workspace at attach time.
- `toolboxes` — `id`, `workspaceId`, `name`, `description`, `deletedAt`,
  timestamps. Partial unique index on `(workspaceId, name)
  WHERE deleted_at IS NULL`.
- `toolbox_tools` — `id`, `toolboxId` (cascade), `toolKey`, timestamps. Unique
  `(toolboxId, toolKey)`. `toolKey` is validated against the server tool catalog.
- `agent_tools` — `id`, `agentId` (cascade), `toolKey` (nullable),
  `toolboxId` (nullable, set null on toolbox delete), timestamps. Exactly one of
  `toolKey`/`toolboxId` per row (check constraint). Unique on the non-null value.
- `agent_instruction_templates` — `id`, `workspaceId`, `name`, `description`,
  `body`, `deletedAt`, timestamps. Partial unique name index like toolboxes.
- `agent_feedback` — `id`, `agentId` (cascade), `userId`, `rating` (integer,
  check 1–5), `comment`, `deletedAt`, timestamps. One active feedback row per
  `(agentId, userId)` via partial unique index.
- `chat_message_feedback` — `id`, `messageId` (cascade), `threadId`, `agentId`
  (nullable), `userId`, `rating` (`up` | `down`), `comment`, timestamps. Unique
  on `messageId`; upsert on re-rating.

Schema lives in `lib/db/schema/agents.ts` (agents + joins), `toolboxes.ts`,
`agent-templates.ts`, and `feedback.ts`, exported from
`lib/db/schema/index.ts`, with a generated migration applied via
`db:migrate` before any runtime reads.

## Server tool catalog

> **Update (2026-10-18):** the MVP knowledge-base tools (`getInformation`,
> `addResource`) were removed — the catalog is now empty and the chat route
> runs without tools. The catalog registry, toolboxes, and agent-tool
> attachment UI/routes remain in place for the future connector-scoped tools.
> Original design below.

A single server-side registry (e.g. `lib/agents/tool-catalog.ts`) defines the
workspace-available tools as `{ key, name, description, factory }` entries.
MVP catalog: knowledge-base retrieval, resource search, connector schema list,
and connector structured query (the latter two activate only for agents whose
topics/tooling allow them). Chat route tools currently inline in
`app/api/chat/route.ts` are reused through this catalog rather than duplicated.

## API surface

Route handlers under `app/api/`, all following the existing auth pattern
(`getCurrentUser` → `getActiveWorkspace`, or row-load +
`getWorkspaceMembership` for id-scoped restore/permanent routes), try/catch
error shape `{ success, error }`, paginated lists returning
`page/pageSize/total/pageCount` with a capped page size.

- `GET/POST /agents` — paginated list (`?status=active|deleted`), create (starts
  in `draft`).
- `GET/PATCH/DELETE /agents/[id]` — detail (with attached topics/tools),
  update, soft delete.
- `POST /agents/[id]/restore`, `DELETE /agents/[id]/permanent`.
- `POST /agents/[id]/deploy`, `POST /agents/[id]/undeploy` — deploy requires at
  least one playground message against the current agent config
  (chat message feedback/threads carry `agentId` and a config snapshot check);
  undeploy returns the agent to `undeployed` (redeploy re-runs validation).
- `PUT/DELETE /agents/[id]/topics` — attach/detach topics (batch body).
- `PUT/DELETE /agents/[id]/tools` — attach/detach individual tools and
  toolboxes; enforces the exclusion rules server-side in a transaction.
- `GET/POST /toolboxes`, `GET/PATCH/DELETE /toolboxes/[id]`,
  `POST /toolboxes/[id]/restore`, `DELETE /toolboxes/[id]/permanent`.
- `PUT/DELETE /toolboxes/[id]/tools` — add/remove tools from a toolbox.
- `GET/POST /agent-templates`, `PATCH/DELETE /agent-templates/[id]`,
  `POST /agent-templates/[id]/restore`, `DELETE .../permanent` — template CRUD;
  "apply" is client-side (copies `body` into the agent form).
- `GET/POST /agents/[id]/feedback` — list and upsert per-agent feedback.
- `PUT /chat/threads/[threadId]/messages/[messageId]/feedback` — upsert message
  feedback; aggregates read through the agent feedback list endpoint.

Chat streaming: the existing `/api/chat` route gains an optional agent context
(thread bound to an agent) that injects the agent's instructions as the system
prompt, restricts embedding retrieval to chunks belonging to the agent's active
topics, and exposes only the resolved active tool set.

## Client data layer

- `api/endpoints.ts` gains `agents`, `toolboxes`, and `agentTemplates` groups.
- `api/agents/{api,types,query}.ts`, `api/toolboxes/...`,
  `api/agent-templates/...` follow the extraction-templates trio: thin typed
  fetchers on the shared axios client, plain types, TanStack Query hooks with
  query-key factories keyed by `(page, pageSize, status)`; mutations invalidate
  the feature's `all` key.
- Topics attachment reuses `useTopics()` from `api/topics/query.ts`.

## UI

All primitives come from `@workspace/ui/components/*`. Files stay under the
250-line limit by splitting page shell, section, columns, and dialogs.

- `/dashboard/agent/builder` list page (`components/pages/agents.tsx` +
  `components/agents/`): `AppBreadcrumb` shell, Active/Deleted status toggle,
  `DataTable` with `getAgentColumns(...)`, manual pagination footer, soft-delete
  and permanent-delete via the shared `DeleteDialog`, restore actions in deleted
  view — mirroring `extraction-templates`.
- Agent dialog (`components/agents/agent-dialog.tsx` + `agent-tool-picker.tsx` +
  `agent-topic-picker.tsx`): constrained-height dialog with fixed header/footer
  and independently scrollable body; portaled controls receive
  `container={contentRef}`. The tool picker renders individual tools and
  toolboxes with the exclusion logic: toolbox-member tools are disabled/hidden
  in the individual list, and selecting a toolbox drops overlapping individual
  selections with visible feedback.
- Agent detail page `/dashboard/agent/[id]` (`components/pages/agent-detail.tsx`
  + children): status badge, deploy/undeploy buttons with playground-run
  gating message, topic/tool summary, per-agent feedback list with aggregate
  rating, and edit dialog reuse.
- Toolbox management (`/dashboard/agent/toolboxes`, `components/toolboxes/`):
  list + CRUD dialog + per-toolbox tool add/remove, same section/columns/dialog
  split. Tools already in the toolbox are filtered out of the add picker.
- Instruction templates (`components/agent-templates/`): section on the builder
  page or a subpage with template CRUD and "apply to agent" action that seeds
  the agent dialog instructions field.
- Chat playground (`/dashboard/agent/[id]/playground`): reuses the chat-thread
  message components and composer from the existing chat page inside a fixed
  layout; threads created here are agent-bound and excluded from the normal
  chat sidebar.
- Message feedback (`components/chat/message-feedback.tsx`): thumbs up/down +
  optional comment on assistant messages, rendered in both normal chats and the
  playground.

## Phases and checklist

### Phase 1 - Data model and migrations

- [x] Add `lib/db/schema/agents.ts`, `toolboxes.ts`, `agent-templates.ts`,
      `feedback.ts` and export them from `lib/db/schema/index.ts`.
- [x] Add partial unique indexes and the `agent_tools` xor check constraint.
- [x] Run `pnpm --filter=cortex-ai db:generate` and `db:migrate` before runtime
      work continues.

### Phase 2 - Agents API and lifecycle

- [x] Agents list (paginated, status filter), create, detail, update, soft
      delete, restore, permanent delete.
- [x] Deploy/undeploy endpoints with playground test-run validation.
- [x] Topic attach/detach with active-topic and workspace validation.

### Phase 3 - Toolboxes and tool attachment

- [x] Server tool catalog module extracted from chat route tools.
- [x] Toolbox CRUD + restore/permanent delete.
- [x] Toolbox tool add/remove with catalog key validation.
- [x] Agent tools attach/detach enforcing both exclusion rules transactionally.

### Phase 4 - Templates and feedback APIs

- [x] Instruction template CRUD + restore/permanent delete.
- [x] Per-agent feedback upsert/list endpoints.
- [x] Per-message feedback endpoint and schema wiring in chat message storage.

### Phase 5 - Agent-scoped chat playground

- [x] Bind threads to agents; thread list excludes playground threads.
- [x] Stream chat with agent instructions, topic-restricted retrieval, and
      resolved active tool set.
- [x] Playground page reusing chat-thread components and message feedback UI.

### Phase 6 - UI and navigation

- [x] Agents list page with active/deleted tabs, pagination, restore, and
      permanent-delete dialogs.
- [x] Agent dialog with topic picker, tool picker (exclusion rules), and
      instruction template picker/apply.
- [x] Agent detail page with status, deploy/undeploy, feedback view.
- [x] Toolbox management page and dialogs.
- [x] Instruction templates management UI.
- [x] Message feedback controls in normal chat threads.
- [x] Sidebar Agent section items for Builder, Toolboxes, Templates.

### Phase 7 - Verification

- [ ] Verify cross-workspace ids are rejected on every id-scoped route.
- [ ] Verify exclusion rules: toolbox-member tools unselectable; toolbox attach
      removes overlapping individual tools; toolbox tool removal prunes agent
      resolution without orphan rows.
- [ ] Verify deploy is impossible without a playground run and undeploy
      re-gates redeploy.
- [ ] Verify soft-deleted agents/toolboxes/templates disappear from active
      lists and restore correctly, including unique-name collision on restore.
- [ ] Verify feedback upserts (re-rating replaces) and per-agent aggregates.
- [x] Run `pnpm --filter=cortex-ai typecheck` and lint.
- [x] Run the cortex-ai production build.
- [ ] Perform manual browser checks on desktop and mobile.

## Acceptance criteria

- A workspace member can create, edit, soft-delete, restore, and permanently
  delete agents, all scoped to their workspace.
- An agent cannot deploy without exercising a playground chat against its
  current configuration; undeploy and re-deploy follow the same gate.
- Retrieval in agent chats returns only content from the agent's attached
  active topics; the model only receives tools resolved from active toolbox and
  individual tool attachments.
- Tools inside any toolbox never appear as individually attachable, and
  attaching a toolbox never leaves a duplicated overlapping individual tool.
- Instruction templates instantiate agent instructions by copy and remain
  editable independently.
- Feedback exists at agent level (rating + comment, one active per user) and at
  chat message level (up/down + comment), both visible for iteration.
- Deleted agents/toolboxes/templates are excluded from active reads, restorable,
  and permanently deletable by a workspace member.
- Existing chat, topics, documents, and connectors behavior is unchanged.

## Follow-up plan candidates

- Agent chat audit surfacing (tool calls, retrieval hits) in the detail page.
- A/B instructions with feedback-driven comparison.
- Scheduled agent runs and external trigger endpoints.
- Template marketplace across workspaces.
- Tool authoring UI beyond the fixed server catalog.
