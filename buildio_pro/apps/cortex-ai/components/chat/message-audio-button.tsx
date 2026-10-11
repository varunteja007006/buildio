"use client";

import { Button } from "@workspace/ui/components/button";
import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useChatPreferences } from "@/api/chat/query";
import { DEFAULT_SPEECH_SETTINGS } from "@/lib/chat/speech-settings";
import type { SpeechSettings } from "@/lib/chat/speech-settings";

export function MessageAudioButton({
  text,
  settings: settingsOverride,
  playLabel = "Listen to response",
}: {
  text: string;
  settings?: SpeechSettings;
  playLabel?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { data: preferences, isLoading } = useChatPreferences();

  useEffect(() => {
    setSupported(
      "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    );
  }, []);

  const togglePlayback = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const settings =
      settingsOverride ?? preferences?.speech ?? DEFAULT_SPEECH_SETTINGS;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    if (settings.language) utterance.lang = settings.language;
    const voice = settings.voiceURI
      ? window.speechSynthesis
          .getVoices()
          .find((option) => option.voiceURI === settings.voiceURI)
      : undefined;
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground"
      onClick={togglePlayback}
      disabled={!supported || !text.trim() || (!settingsOverride && isLoading)}
      aria-label={speaking ? "Stop audio" : playLabel}
      title={speaking ? "Stop audio" : playLabel}
    >
      {speaking ? <VolumeXIcon /> : <Volume2Icon />}
    </Button>
  );
}
