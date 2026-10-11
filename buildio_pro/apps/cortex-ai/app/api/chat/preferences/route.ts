import { NextResponse } from "next/server";

import { isWellFormedChatModelId } from "@/lib/chat/models";
import {
  getOrCreateChatPreferences,
  updateChatPreferences,
} from "@/lib/chat/preferences";
import {
  isSpeechSettings,
  type SpeechSettings,
} from "@/lib/chat/speech-settings";
import { getCurrentUser } from "@/lib/session";

function response(
  preferences: Awaited<ReturnType<typeof getOrCreateChatPreferences>>,
) {
  return {
    defaultModel: preferences.defaultModel,
    speech: preferences.speech,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const preferences = await getOrCreateChatPreferences(user.id);
    return NextResponse.json(response(preferences));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid preferences" },
        { status: 400 },
      );
    }

    const updates: { defaultModel?: string; speech?: SpeechSettings } = {};
    if (body.defaultModel !== undefined) {
      if (!isWellFormedChatModelId(body.defaultModel)) {
        return NextResponse.json(
          { success: false, error: "Invalid model" },
          { status: 400 },
        );
      }
      updates.defaultModel = body.defaultModel;
    }
    if (body.speech !== undefined) {
      if (!isSpeechSettings(body.speech)) {
        return NextResponse.json(
          { success: false, error: "Invalid speech settings" },
          { status: 400 },
        );
      }
      updates.speech = body.speech;
    }
    if (updates.defaultModel === undefined && updates.speech === undefined) {
      return NextResponse.json(
        { success: false, error: "No preferences provided" },
        { status: 400 },
      );
    }

    const preferences = await updateChatPreferences(user.id, updates);
    return NextResponse.json(response(preferences));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
