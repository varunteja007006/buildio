import { eq } from "drizzle-orm";

import { getDefaultChatModelId } from "@/lib/chat/models";
import {
  DEFAULT_SPEECH_SETTINGS,
  type SpeechSettings,
} from "@/lib/chat/speech-settings";
import { db } from "@/lib/db";
import { chatPreferences } from "@/lib/db/schema/chat-preferences";

export type ChatPreferences = {
  userId: string;
  defaultModel: string;
  speech: SpeechSettings;
};

function toChatPreferences(
  row: typeof chatPreferences.$inferSelect,
): ChatPreferences {
  return {
    userId: row.userId,
    defaultModel: row.defaultModel,
    speech: {
      voiceURI: row.speechVoiceURI,
      language: row.speechLanguage,
      rate: row.speechRate,
      pitch: row.speechPitch,
      volume: row.speechVolume,
    },
  };
}

/**
 * Returns the user's chat preferences, creating a row with the default
 * model on first access. Safe to call concurrently.
 */
export async function getOrCreateChatPreferences(
  userId: string,
): Promise<ChatPreferences> {
  const [existing] = await db
    .select()
    .from(chatPreferences)
    .where(eq(chatPreferences.userId, userId))
    .limit(1);

  if (existing) {
    return toChatPreferences(existing);
  }

  await db.insert(chatPreferences).values({ userId }).onConflictDoNothing();

  const [created] = await db
    .select()
    .from(chatPreferences)
    .where(eq(chatPreferences.userId, userId))
    .limit(1);

  return created
    ? toChatPreferences(created)
    : {
        userId,
        defaultModel: getDefaultChatModelId(),
        speech: DEFAULT_SPEECH_SETTINGS,
      };
}

export async function updateChatPreferences(
  userId: string,
  updates: { defaultModel?: string; speech?: SpeechSettings },
): Promise<ChatPreferences> {
  await getOrCreateChatPreferences(userId);

  const speech = updates.speech;
  const [updated] = await db
    .update(chatPreferences)
    .set({
      ...(updates.defaultModel ? { defaultModel: updates.defaultModel } : {}),
      ...(speech
        ? {
            speechVoiceURI: speech.voiceURI,
            speechLanguage: speech.language,
            speechRate: speech.rate,
            speechPitch: speech.pitch,
            speechVolume: speech.volume,
          }
        : {}),
    })
    .where(eq(chatPreferences.userId, userId))
    .returning();

  return updated
    ? toChatPreferences(updated)
    : getOrCreateChatPreferences(userId);
}
