import { sql } from "drizzle-orm";
import { pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { getDefaultChatModelId } from "../../chat/models";

/**
 * Per-user chat settings. One row per user, created lazily with the app
 * default model when the user first interacts with chat settings.
 */
export const chatPreferences = pgTable("chat_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  defaultModel: text("default_model")
    .notNull()
    // Runtime default from CHAT_DEFAULT_MODEL — no model id is baked into DDL.
    .$defaultFn(() => getDefaultChatModelId()),
  speechVoiceURI: text("speech_voice_uri"),
  speechLanguage: text("speech_language"),
  speechRate: real("speech_rate").default(1).notNull(),
  speechPitch: real("speech_pitch").default(1).notNull(),
  speechVolume: real("speech_volume").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull()
    .$onUpdateFn(() => sql`now()`),
});
