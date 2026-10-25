CREATE TABLE "agent_instruction_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"body" text NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "agent_tools" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tool_key" text,
	"toolbox_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_tools_tool_or_toolbox_check" CHECK (("agent_tools"."tool_key" IS NOT NULL AND "agent_tools"."toolbox_id" IS NULL) OR ("agent_tools"."tool_key" IS NULL AND "agent_tools"."toolbox_id" IS NOT NULL))
);

CREATE TABLE "agent_topics" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"instructions" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"last_deployed_at" timestamp with time zone,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"thread_id" text,
	"model" text,
	"provider" text,
	"finish_reason" text,
	"raw_finish_reason" text,
	"user_query" text,
	"response_text" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"cache_read_tokens" integer,
	"cache_write_tokens" integer,
	"reasoning_tokens" integer,
	"text_tokens" integer,
	"time_to_first_output_ms" integer,
	"step_time_ms" integer,
	"response_time_ms" integer,
	"performance" jsonb,
	"usage" jsonb,
	"tool_calls" jsonb,
	"tool_results" jsonb,
	"warnings" jsonb,
	"raw_request" jsonb,
	"raw_response" jsonb,
	"guardrail_checked" boolean DEFAULT false NOT NULL,
	"guardrail_flagged" boolean DEFAULT false NOT NULL,
	"guardrail_blocked" boolean DEFAULT false NOT NULL,
	"guardrail_severity" text,
	"guardrail_categories" jsonb,
	"guardrail_reason" text,
	"guardrail_model" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"default_model" text NOT NULL,
	"speech_voice_uri" text,
	"speech_language" text,
	"speech_rate" real DEFAULT 1 NOT NULL,
	"speech_pitch" real DEFAULT 1 NOT NULL,
	"speech_volume" real DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "connections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"host" text,
	"port" integer,
	"username" text,
	"password_encrypted" text,
	"database" text,
	"sqlite_file_key" text,
	"sqlite_file_name" text,
	"sqlite_file_size_bytes" integer,
	"status" text DEFAULT 'unverified' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"last_error" text,
	"source_epoch" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "connector_schema_syncs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"source_epoch" integer NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"target_hash" text,
	"table_count" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" text
);

CREATE TABLE "connector_table_contexts" (
	"table_id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"explanation" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"edited_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "connector_tables" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"source_epoch" integer NOT NULL,
	"source_object_id" text,
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	"object_type" text NOT NULL,
	"database_comment" text,
	"fingerprint" text,
	"status" text DEFAULT 'active' NOT NULL,
	"review_reason" text,
	"last_seen_sync_id" text,
	"last_seen_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "document_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text NOT NULL,
	"action" text NOT NULL,
	"document_ids" jsonb,
	"extraction_id" text,
	"template_snapshot" jsonb,
	"instructions_snapshot" text,
	"raw_ai_output" text,
	"final_output" text,
	"model" text,
	"provider" text,
	"usage" jsonb,
	"duration_ms" integer,
	"status" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"filename" text NOT NULL,
	"filepath" text NOT NULL,
	"file_hash" text NOT NULL,
	"ingested" boolean DEFAULT false NOT NULL,
	"last_ingest_error" text,
	"deleted_at" timestamp with time zone,
	"deleted_batch_id" text,
	"topic_id" text,
	"folder_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_batch_id" text
);

CREATE TABLE "extraction_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"instructions" text NOT NULL,
	"output_schema" jsonb,
	"default_model" text,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "extraction_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"extraction_id" text NOT NULL,
	"version" integer NOT NULL,
	"source" text NOT NULL,
	"content" text NOT NULL,
	"structured_output" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "extractions" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"template_id" text,
	"template_snapshot" jsonb,
	"model" text,
	"provider" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"raw_output" text,
	"current_content" text,
	"structured_output" jsonb,
	"error" text,
	"usage" jsonb,
	"auto_ingest" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"resource_id" text,
	"deleted_at" timestamp with time zone,
	"deleted_batch_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "agent_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_feedback_rating_check" CHECK ("agent_feedback"."rating" >= 1 AND "agent_feedback"."rating" <= 5)
);

CREATE TABLE "chat_message_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"agent_id" text,
	"user_id" text NOT NULL,
	"rating" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "folders" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"parent_folder_id" text,
	"name" text NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_batch_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folders_depth_check" CHECK ("folders"."depth" BETWEEN 0 AND 5)
);

CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"content" text NOT NULL,
	"document_id" text,
	"deleted_at" timestamp with time zone,
	"deleted_batch_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"agent_id" text,
	"title" text,
	"model" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "toolbox_tools" (
	"id" text PRIMARY KEY NOT NULL,
	"toolbox_id" text NOT NULL,
	"tool_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "toolboxes" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_batch_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_personal" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "agent_instruction_templates" ADD CONSTRAINT "agent_instruction_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_instruction_templates" ADD CONSTRAINT "agent_instruction_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_toolbox_id_toolboxes_id_fk" FOREIGN KEY ("toolbox_id") REFERENCES "public"."toolboxes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_topics" ADD CONSTRAINT "agent_topics_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_topics" ADD CONSTRAINT "agent_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agents" ADD CONSTRAINT "agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "chat_preferences" ADD CONSTRAINT "chat_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connections" ADD CONSTRAINT "connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connections" ADD CONSTRAINT "connections_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "connector_schema_syncs" ADD CONSTRAINT "connector_schema_syncs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_schema_syncs" ADD CONSTRAINT "connector_schema_syncs_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_schema_syncs" ADD CONSTRAINT "connector_schema_syncs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_table_id_connector_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."connector_tables"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "connector_tables" ADD CONSTRAINT "connector_tables_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_tables" ADD CONSTRAINT "connector_tables_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "connector_tables" ADD CONSTRAINT "connector_tables_last_seen_sync_id_connector_schema_syncs_id_fk" FOREIGN KEY ("last_seen_sync_id") REFERENCES "public"."connector_schema_syncs"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_extraction_id_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extractions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "documents" ADD CONSTRAINT "documents_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extraction_templates" ADD CONSTRAINT "extraction_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extraction_templates" ADD CONSTRAINT "extraction_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "extraction_versions" ADD CONSTRAINT "extraction_versions_extraction_id_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extractions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extraction_versions" ADD CONSTRAINT "extraction_versions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_template_id_extraction_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."extraction_templates"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_message_feedback" ADD CONSTRAINT "chat_message_feedback_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_message_feedback" ADD CONSTRAINT "chat_message_feedback_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_message_feedback" ADD CONSTRAINT "chat_message_feedback_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "chat_message_feedback" ADD CONSTRAINT "chat_message_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "folders" ADD CONSTRAINT "folders_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_folder_id_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "resources" ADD CONSTRAINT "resources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "resources" ADD CONSTRAINT "resources_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "toolbox_tools" ADD CONSTRAINT "toolbox_tools_toolbox_id_toolboxes_id_fk" FOREIGN KEY ("toolbox_id") REFERENCES "public"."toolboxes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "toolboxes" ADD CONSTRAINT "toolboxes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "topics" ADD CONSTRAINT "topics_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "agent_instruction_templates_workspace_idx" ON "agent_instruction_templates" USING btree ("workspace_id");
CREATE UNIQUE INDEX "agent_instruction_templates_workspace_name_idx" ON "agent_instruction_templates" USING btree ("workspace_id","name") WHERE "agent_instruction_templates"."deleted_at" IS NULL;
CREATE INDEX "agent_tools_agent_idx" ON "agent_tools" USING btree ("agent_id");
CREATE INDEX "agent_tools_toolbox_idx" ON "agent_tools" USING btree ("toolbox_id");
CREATE UNIQUE INDEX "agent_tools_agent_tool_key_idx" ON "agent_tools" USING btree ("agent_id","tool_key") WHERE "agent_tools"."tool_key" IS NOT NULL;
CREATE UNIQUE INDEX "agent_tools_agent_toolbox_idx" ON "agent_tools" USING btree ("agent_id","toolbox_id") WHERE "agent_tools"."toolbox_id" IS NOT NULL;
CREATE INDEX "agent_topics_agent_idx" ON "agent_topics" USING btree ("agent_id");
CREATE INDEX "agent_topics_topic_idx" ON "agent_topics" USING btree ("topic_id");
CREATE UNIQUE INDEX "agent_topics_agent_topic_idx" ON "agent_topics" USING btree ("agent_id","topic_id");
CREATE INDEX "agents_workspace_idx" ON "agents" USING btree ("workspace_id");
CREATE UNIQUE INDEX "agents_workspace_name_idx" ON "agents" USING btree ("workspace_id","name") WHERE "agents"."deleted_at" IS NULL;
CREATE INDEX "chat_audit_logs_user_idx" ON "chat_audit_logs" USING btree ("user_id");
CREATE INDEX "chat_audit_logs_workspace_idx" ON "chat_audit_logs" USING btree ("workspace_id");
CREATE INDEX "chat_audit_logs_thread_idx" ON "chat_audit_logs" USING btree ("thread_id");
CREATE INDEX "chat_audit_logs_created_at_idx" ON "chat_audit_logs" USING btree ("created_at");
CREATE INDEX "connections_workspace_idx" ON "connections" USING btree ("workspace_id");
CREATE UNIQUE INDEX "connections_workspace_name_idx" ON "connections" USING btree ("workspace_id","name") WHERE "connections"."deleted_at" IS NULL;
CREATE UNIQUE INDEX "connector_schema_syncs_running_idx" ON "connector_schema_syncs" USING btree ("connection_id") WHERE "connector_schema_syncs"."status" = 'running';
CREATE INDEX "connector_schema_syncs_history_idx" ON "connector_schema_syncs" USING btree ("workspace_id","connection_id","started_at");
CREATE INDEX "connector_table_contexts_listing_idx" ON "connector_table_contexts" USING btree ("workspace_id","connection_id");
CREATE UNIQUE INDEX "connector_tables_name_identity_idx" ON "connector_tables" USING btree ("connection_id","source_epoch","schema_name","table_name") WHERE "connector_tables"."status" = 'active';
CREATE UNIQUE INDEX "connector_tables_native_identity_idx" ON "connector_tables" USING btree ("connection_id","source_epoch","source_object_id") WHERE "connector_tables"."status" = 'active' AND "connector_tables"."source_object_id" IS NOT NULL;
CREATE INDEX "connector_tables_listing_idx" ON "connector_tables" USING btree ("workspace_id","connection_id","status");
CREATE INDEX "document_audit_logs_user_idx" ON "document_audit_logs" USING btree ("user_id");
CREATE INDEX "document_audit_logs_workspace_idx" ON "document_audit_logs" USING btree ("workspace_id");
CREATE INDEX "document_audit_logs_extraction_idx" ON "document_audit_logs" USING btree ("extraction_id");
CREATE INDEX "document_audit_logs_created_at_idx" ON "document_audit_logs" USING btree ("created_at");
CREATE INDEX "documents_workspace_idx" ON "documents" USING btree ("workspace_id");
CREATE INDEX "documents_topic_idx" ON "documents" USING btree ("topic_id");
CREATE INDEX "documents_folder_idx" ON "documents" USING btree ("folder_id");
CREATE INDEX "embeddings_workspace_idx" ON "embeddings" USING btree ("workspace_id");
CREATE INDEX "embeddings_resource_idx" ON "embeddings" USING btree ("resource_id");
CREATE INDEX "embeddings_hnsw_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "extraction_templates_workspace_idx" ON "extraction_templates" USING btree ("workspace_id");
CREATE UNIQUE INDEX "extraction_templates_workspace_name_idx" ON "extraction_templates" USING btree ("workspace_id","name") WHERE "extraction_templates"."deleted_at" IS NULL;
CREATE INDEX "extraction_versions_extraction_idx" ON "extraction_versions" USING btree ("extraction_id");
CREATE INDEX "extractions_document_idx" ON "extractions" USING btree ("document_id");
CREATE INDEX "extractions_template_idx" ON "extractions" USING btree ("template_id");
CREATE INDEX "extractions_status_idx" ON "extractions" USING btree ("status");
CREATE INDEX "agent_feedback_agent_idx" ON "agent_feedback" USING btree ("agent_id");
CREATE UNIQUE INDEX "agent_feedback_agent_user_idx" ON "agent_feedback" USING btree ("agent_id","user_id") WHERE "agent_feedback"."deleted_at" IS NULL;
CREATE UNIQUE INDEX "chat_message_feedback_message_idx" ON "chat_message_feedback" USING btree ("message_id");
CREATE INDEX "chat_message_feedback_agent_idx" ON "chat_message_feedback" USING btree ("agent_id");
CREATE INDEX "folders_workspace_idx" ON "folders" USING btree ("workspace_id");
CREATE INDEX "folders_topic_idx" ON "folders" USING btree ("topic_id");
CREATE INDEX "folders_parent_idx" ON "folders" USING btree ("parent_folder_id");
CREATE INDEX "chat_messages_thread_idx" ON "chat_messages" USING btree ("thread_id");
CREATE INDEX "chat_messages_thread_created_at_idx" ON "chat_messages" USING btree ("thread_id","created_at");
CREATE INDEX "resources_workspace_idx" ON "resources" USING btree ("workspace_id");
CREATE INDEX "resources_document_idx" ON "resources" USING btree ("document_id");
CREATE INDEX "chat_threads_user_idx" ON "chat_threads" USING btree ("user_id");
CREATE INDEX "chat_threads_workspace_idx" ON "chat_threads" USING btree ("workspace_id");
CREATE INDEX "chat_threads_agent_idx" ON "chat_threads" USING btree ("agent_id");
CREATE INDEX "chat_threads_user_workspace_updated_at_idx" ON "chat_threads" USING btree ("user_id","workspace_id","updated_at");
CREATE INDEX "chat_threads_user_updated_at_idx" ON "chat_threads" USING btree ("user_id","updated_at");
CREATE INDEX "toolbox_tools_toolbox_idx" ON "toolbox_tools" USING btree ("toolbox_id");
CREATE UNIQUE INDEX "toolbox_tools_toolbox_key_idx" ON "toolbox_tools" USING btree ("toolbox_id","tool_key");
CREATE INDEX "toolboxes_workspace_idx" ON "toolboxes" USING btree ("workspace_id");
CREATE UNIQUE INDEX "toolboxes_workspace_name_idx" ON "toolboxes" USING btree ("workspace_id","name") WHERE "toolboxes"."deleted_at" IS NULL;
CREATE INDEX "topics_workspace_idx" ON "topics" USING btree ("workspace_id");
CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("workspace_id","slug") WHERE "topics"."deleted_at" IS NULL;
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");
CREATE INDEX "workspace_members_workspace_idx" ON "workspace_members" USING btree ("workspace_id");
CREATE UNIQUE INDEX "workspace_members_user_workspace_uq" ON "workspace_members" USING btree ("user_id","workspace_id");
CREATE INDEX "workspaces_created_by_idx" ON "workspaces" USING btree ("created_by");
