CREATE TYPE "public"."transaction_direction" AS ENUM('debit', 'credit');
CREATE TYPE "public"."transaction_type" AS ENUM('expense', 'income', 'transfer', 'investment', 'loan_payment', 'insurance', 'refund', 'interest', 'fee', 'cash_withdrawal', 'round_up', 'unknown');
CREATE TYPE "public"."statement_document_type" AS ENUM('credit_card', 'bank_statement', 'income_statement', 'income_tax_statement');
CREATE TYPE "public"."statement_upload_status" AS ENUM('pending', 'uploaded', 'processing', 'processed', 'failed');
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"line1" text NOT NULL,
	"line2" text,
	"line3" text,
	"pincode" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"city_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "city" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"state_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "country" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "state" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"country_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "bank_account_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "bank_account_types_name_unique" UNIQUE("name")
);

CREATE TABLE "bank_address" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_id" text NOT NULL,
	"address_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "banks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"ifsc" text,
	"micr" text,
	"iin" text,
	"ach_credit" boolean DEFAULT false NOT NULL,
	"ach_debit" boolean DEFAULT false NOT NULL,
	"apbs" boolean DEFAULT false NOT NULL,
	"nach_debit" boolean DEFAULT false NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "banks_code_unique" UNIQUE("code")
);

CREATE TABLE "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"budget_amount" numeric NOT NULL,
	"start_month" timestamp NOT NULL,
	"end_month" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "expense_category" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "platform_type" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);

CREATE TABLE "currency" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"symbol_native" text NOT NULL,
	"decimal_digits" integer NOT NULL,
	"rounding" numeric(10, 4) DEFAULT '0' NOT NULL,
	"name_plural" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "currency_exchange_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"currency_id" text NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"rates" jsonb NOT NULL,
	"provider" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"estimated_budget" numeric,
	"start_date" timestamp,
	"end_date" timestamp,
	"status_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "event_expense" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"expense_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "event_status" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "event_status_label_unique" UNIQUE("label")
);

CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"budget_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "financial_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bank_account_id" text,
	"statement_upload_id" text,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"currency_id" text,
	"direction" "transaction_direction" NOT NULL,
	"transaction_type" "transaction_type" DEFAULT 'unknown' NOT NULL,
	"merchant_name" text,
	"counterparty_name" text,
	"description" text,
	"raw_description" text,
	"reference_number" text,
	"balance_after" numeric(19, 4),
	"payment_method_id" text,
	"category_id" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"is_transfer" boolean DEFAULT false NOT NULL,
	"is_emi" boolean DEFAULT false NOT NULL,
	"emi_installment_number" integer,
	"emi_total_installments" integer,
	"international" boolean DEFAULT false NOT NULL,
	"reward_points" numeric(19, 4),
	"linked_transaction_id" text,
	"extraction_confidence" numeric(5, 4),
	"reviewed_at" timestamp,
	"extraction_version" integer DEFAULT 1 NOT NULL,
	"superseded_at" timestamp,
	"transaction_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "income" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"name" text,
	"source_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "income_source" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "investment_platforms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website_url" text,
	"platform_type" text,
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "investment_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"user_id" text NOT NULL,
	"platform_id" text,
	"investment_type_id" text,
	"units" numeric(19, 8),
	"unit_price" numeric(19, 8),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "investment_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"risk_level" text,
	"liquidity_profile" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"payment_provider_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "payment_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "statement_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_type" "statement_document_type" NOT NULL,
	"original_filename" text NOT NULL,
	"s3_key" text NOT NULL,
	"content_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"status" "statement_upload_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp,
	"processed_transactions_count" integer,
	"extraction_version" integer DEFAULT 0 NOT NULL,
	"processing_error" text,
	"extraction_model" text,
	"statement_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "statement_upload_s3_key_unique" UNIQUE("s3_key")
);

CREATE TABLE "transaction_transfer" (
	"id" text PRIMARY KEY NOT NULL,
	"from_transaction_id" text NOT NULL,
	"to_transaction_id" text NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "user_bank_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"bank_account_type" text NOT NULL,
	"bank" text NOT NULL,
	"account_number_masked" text,
	"account_number_hash" text,
	"currency_id" text,
	"last_four" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "user_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"max_profiles" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

ALTER TABLE "address" ADD CONSTRAINT "address_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "city" ADD CONSTRAINT "city_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "state" ADD CONSTRAINT "state_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bank_address" ADD CONSTRAINT "bank_address_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bank_address" ADD CONSTRAINT "bank_address_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "budget" ADD CONSTRAINT "budget_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expense_category" ADD CONSTRAINT "expense_category_parent_id_expense_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."expense_category"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "currency_exchange_snapshot" ADD CONSTRAINT "currency_exchange_snapshot_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event" ADD CONSTRAINT "event_status_id_event_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."event_status"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expense" ADD CONSTRAINT "expense_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expense" ADD CONSTRAINT "expense_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expense" ADD CONSTRAINT "expense_category_id_expense_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_category"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "expense" ADD CONSTRAINT "expense_budget_id_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budget"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_bank_account_id_user_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."user_bank_account"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_statement_upload_id_statement_upload_id_fk" FOREIGN KEY ("statement_upload_id") REFERENCES "public"."statement_upload"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_category_id_expense_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_category"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_linked_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("linked_transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "income" ADD CONSTRAINT "income_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "income" ADD CONSTRAINT "income_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "income" ADD CONSTRAINT "income_source_id_income_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."income_source"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "investment_platforms" ADD CONSTRAINT "investment_platforms_platform_type_platform_type_id_fk" FOREIGN KEY ("platform_type") REFERENCES "public"."platform_type"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_platform_id_investment_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."investment_platforms"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_investment_type_id_investment_types_id_fk" FOREIGN KEY ("investment_type_id") REFERENCES "public"."investment_types"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_payment_provider_id_payment_providers_id_fk" FOREIGN KEY ("payment_provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "statement_upload" ADD CONSTRAINT "statement_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transaction_transfer" ADD CONSTRAINT "transaction_transfer_from_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("from_transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transaction_transfer" ADD CONSTRAINT "transaction_transfer_to_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("to_transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_bank_account" ADD CONSTRAINT "user_bank_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_bank_account" ADD CONSTRAINT "user_bank_account_bank_account_type_bank_account_types_id_fk" FOREIGN KEY ("bank_account_type") REFERENCES "public"."bank_account_types"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_bank_account" ADD CONSTRAINT "user_bank_account_bank_banks_id_fk" FOREIGN KEY ("bank") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_bank_account" ADD CONSTRAINT "user_bank_account_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "financial_transaction_user_id_hash_version_uidx" ON "financial_transaction" USING btree ("user_id","transaction_hash","extraction_version");
CREATE INDEX "idx_financial_transaction_user_id" ON "financial_transaction" USING btree ("user_id");
CREATE INDEX "idx_financial_transaction_bank_account_id" ON "financial_transaction" USING btree ("bank_account_id");
CREATE INDEX "idx_financial_transaction_statement_upload_id" ON "financial_transaction" USING btree ("statement_upload_id");
CREATE INDEX "idx_financial_transaction_transaction_date" ON "financial_transaction" USING btree ("transaction_date");
CREATE INDEX "idx_financial_transaction_category_id" ON "financial_transaction" USING btree ("category_id");
CREATE INDEX "idx_financial_transaction_payment_method_id" ON "financial_transaction" USING btree ("payment_method_id");
CREATE INDEX "idx_statement_upload_user_id" ON "statement_upload" USING btree ("user_id");
CREATE INDEX "idx_statement_upload_status" ON "statement_upload" USING btree ("status");
