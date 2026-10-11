export type SpeechSettings = {
  voiceURI: string | null;
  language: string | null;
  rate: number;
  pitch: number;
  volume: number;
};

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  voiceURI: null,
  language: null,
  rate: 1,
  pitch: 1,
  volume: 1,
};

export function isSpeechSettings(value: unknown): value is SpeechSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<SpeechSettings>;

  return (
    (settings.voiceURI === null ||
      (typeof settings.voiceURI === "string" &&
        settings.voiceURI.length <= 512)) &&
    (settings.language === null ||
      (typeof settings.language === "string" &&
        settings.language.length <= 35)) &&
    typeof settings.rate === "number" &&
    Number.isFinite(settings.rate) &&
    settings.rate >= 0.5 &&
    settings.rate <= 2 &&
    typeof settings.pitch === "number" &&
    Number.isFinite(settings.pitch) &&
    settings.pitch >= 0 &&
    settings.pitch <= 2 &&
    typeof settings.volume === "number" &&
    Number.isFinite(settings.volume) &&
    settings.volume >= 0 &&
    settings.volume <= 1
  );
}
