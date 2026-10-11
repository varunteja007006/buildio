"use client";

import { Button } from "@workspace/ui/components/button";
import type { ComboboxOption } from "@workspace/ui/components/combobox";
import { Label } from "@workspace/ui/components/label";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useChatPreferences, useUpdateChatPreferences } from "@/api/chat/query";
import { SearchableSetting } from "@/components/account/searchable-setting";
import { MessageAudioButton } from "@/components/chat/message-audio-button";
import { DEFAULT_SPEECH_SETTINGS } from "@/lib/chat/speech-settings";
import type { SpeechSettings } from "@/lib/chat/speech-settings";

const SYSTEM_DEFAULT = "__system_default__";
const previewText = "Hello! This is a sample of your selected voice settings.";

function RangeSetting({
  id,
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {value.toFixed(step < 0.1 ? 2 : 1)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export function SpeechSettingsForm() {
  const { data, isLoading, isError } = useChatPreferences();
  const update = useUpdateChatPreferences();
  const [speech, setSpeech] = useState(DEFAULT_SPEECH_SETTINGS);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setSpeech(data.speech);
  }, [data]);

  useEffect(() => {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      return;
    }
    setSupported(true);
    const synthesis = window.speechSynthesis;
    const loadVoices = () => setVoices(synthesis.getVoices());
    loadVoices();
    synthesis.addEventListener("voiceschanged", loadVoices);
    return () => synthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const change = (update: Partial<SpeechSettings>) => {
    setSaved(false);
    setSpeech((current) => ({ ...current, ...update }));
  };

  const voiceOptions = useMemo<ComboboxOption[]>(() => {
    const options: ComboboxOption[] = [
      {
        value: SYSTEM_DEFAULT,
        label: "System default",
        searchValue: "system default",
      },
      ...voices.map((voice) => ({
        value: voice.voiceURI,
        label: `${voice.name} (${voice.lang})`,
        searchValue: `${voice.name} ${voice.lang} ${voice.voiceURI}`,
      })),
    ];
    if (
      speech.voiceURI &&
      !voices.some((voice) => voice.voiceURI === speech.voiceURI)
    ) {
      options.push({
        value: speech.voiceURI,
        label: "Saved voice (unavailable on this device)",
        searchValue: "saved voice unavailable",
      });
    }
    return options;
  }, [speech.voiceURI, voices]);

  const languageOptions = useMemo<ComboboxOption[]>(() => {
    const languages = [
      ...new Set(voices.map((voice) => voice.lang).filter(Boolean)),
    ];
    if (speech.language && !languages.includes(speech.language)) {
      languages.push(speech.language);
    }
    return [
      {
        value: SYSTEM_DEFAULT,
        label: "System default",
        searchValue: "system default",
      },
      ...languages.map((language) => ({
        value: language,
        label: language,
        searchValue: language,
      })),
    ];
  }, [speech.language, voices]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update.mutate({ speech }, { onSuccess: () => setSaved(true) });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading preferences…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Could not load your preferences.
        </p>
      ) : (
        <>
          <SearchableSetting
            id="speech-voice"
            label="Voice"
            options={voiceOptions}
            value={speech.voiceURI ?? SYSTEM_DEFAULT}
            disabled={!data || update.isPending}
            searchPlaceholder="Search voices…"
            emptyMessage="No voices found."
            onChange={(voiceURI) =>
              change({
                voiceURI: voiceURI === SYSTEM_DEFAULT ? null : voiceURI,
              })
            }
          />
          <SearchableSetting
            id="speech-language"
            label="Language"
            options={languageOptions}
            value={speech.language ?? SYSTEM_DEFAULT}
            disabled={!data || update.isPending}
            searchPlaceholder="Search languages…"
            emptyMessage="No languages found."
            onChange={(language) =>
              change({
                language: language === SYSTEM_DEFAULT ? null : language,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <RangeSetting
              id="speech-rate"
              label="Rate"
              value={speech.rate}
              min={0.5}
              max={2}
              step={0.1}
              disabled={!data || update.isPending}
              onChange={(rate) => change({ rate })}
            />
            <RangeSetting
              id="speech-pitch"
              label="Pitch"
              value={speech.pitch}
              min={0}
              max={2}
              step={0.1}
              disabled={!data || update.isPending}
              onChange={(pitch) => change({ pitch })}
            />
            <RangeSetting
              id="speech-volume"
              label="Volume"
              value={speech.volume}
              min={0}
              max={1}
              step={0.05}
              disabled={!data || update.isPending}
              onChange={(volume) => change({ volume })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
            <p className="flex-1 text-sm text-muted-foreground">
              {previewText}
            </p>
            <MessageAudioButton
              text={previewText}
              settings={speech}
              playLabel="Try settings"
            />
            {!supported ? (
              <span className="text-xs text-muted-foreground">
                Speech is not supported in this browser.
              </span>
            ) : null}
          </div>

          {update.isError ? (
            <p className="text-sm text-destructive">
              {update.error.message || "Could not save speech settings."}
            </p>
          ) : saved ? (
            <p className="text-sm text-muted-foreground">Settings saved.</p>
          ) : null}

          <Button type="submit" disabled={!data || update.isPending}>
            {update.isPending ? "Saving…" : "Save speech settings"}
          </Button>
        </>
      )}
    </form>
  );
}
