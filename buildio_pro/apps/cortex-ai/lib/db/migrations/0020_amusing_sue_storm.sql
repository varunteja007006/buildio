ALTER TABLE "chat_preferences" ADD COLUMN "speech_voice_uri" text;--> statement-breakpoint
ALTER TABLE "chat_preferences" ADD COLUMN "speech_language" text;--> statement-breakpoint
ALTER TABLE "chat_preferences" ADD COLUMN "speech_rate" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_preferences" ADD COLUMN "speech_pitch" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_preferences" ADD COLUMN "speech_volume" real DEFAULT 1 NOT NULL;