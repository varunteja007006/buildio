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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "connections" ADD COLUMN "source_epoch" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "connector_schema_syncs" ADD CONSTRAINT "connector_schema_syncs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_schema_syncs" ADD CONSTRAINT "connector_schema_syncs_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_schema_syncs" ADD CONSTRAINT "connector_schema_syncs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_table_id_connector_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."connector_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_table_contexts" ADD CONSTRAINT "connector_table_contexts_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_tables" ADD CONSTRAINT "connector_tables_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_tables" ADD CONSTRAINT "connector_tables_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_tables" ADD CONSTRAINT "connector_tables_last_seen_sync_id_connector_schema_syncs_id_fk" FOREIGN KEY ("last_seen_sync_id") REFERENCES "public"."connector_schema_syncs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "connector_schema_syncs_running_idx" ON "connector_schema_syncs" USING btree ("connection_id") WHERE "connector_schema_syncs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "connector_schema_syncs_history_idx" ON "connector_schema_syncs" USING btree ("workspace_id","connection_id","started_at");--> statement-breakpoint
CREATE INDEX "connector_table_contexts_listing_idx" ON "connector_table_contexts" USING btree ("workspace_id","connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "connector_tables_name_identity_idx" ON "connector_tables" USING btree ("connection_id","source_epoch","schema_name","table_name") WHERE "connector_tables"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "connector_tables_native_identity_idx" ON "connector_tables" USING btree ("connection_id","source_epoch","source_object_id") WHERE "connector_tables"."status" = 'active' AND "connector_tables"."source_object_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "connector_tables_listing_idx" ON "connector_tables" USING btree ("workspace_id","connection_id","status");