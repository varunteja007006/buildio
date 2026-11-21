"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useEffect, useRef, useState } from "react";

type VoiceOption = SpeechSynthesisVoice;
type SavedDraw = { numbers: number[] };
const STORAGE_KEY = "housie-number-generator-draw";

function isSavedDraw(value: unknown): value is SavedDraw {
  if (!value || typeof value !== "object") return false;
  const draw = value as Partial<SavedDraw>;
  if (!Array.isArray(draw.numbers) || draw.numbers.length > 100) return false;
  if (
    !draw.numbers.every(
      (number) => Number.isInteger(number) && number >= 1 && number <= 100,
    )
  )
    return false;
  if (new Set(draw.numbers).size !== draw.numbers.length) return false;
  return true;
}

export default function HousieNumGenerator() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const cancelReset = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isSavedDraw(parsed)) {
          setNumbers(parsed.numbers);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Storage may be disabled or unavailable; the game remains usable in memory.
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    const speech = window.speechSynthesis;
    if (!speech || typeof SpeechSynthesisUtterance !== "function") return;

    const loadVoices = () => {
      let availableVoices: VoiceOption[];
      try {
        availableVoices = speech.getVoices();
      } catch {
        return;
      }
      setVoices(availableVoices);
      setSelectedVoice(
        (previous) =>
          availableVoices.find(
            (voice) => voice.voiceURI === previous?.voiceURI,
          ) ??
          availableVoices.find((voice) =>
            voice.lang.toLowerCase().includes("en-in"),
          ) ??
          availableVoices[0] ??
          null,
      );
    };
    loadVoices();
    setSpeechAvailable(true);
    speech.addEventListener("voiceschanged", loadVoices);
    return () => speech.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const stopAnnouncements = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // The speech service can fail independently of the game.
    }
  };

  const speakNumber = (num: number) => {
    if (!speechAvailable || !voiceEnabled) return;
    try {
      const utterance = new SpeechSynthesisUtterance(`Number ${num}`);
      utterance.rate = 0.9;
      utterance.voice = selectedVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Keep number drawing available if the speech service fails at runtime.
    }
  };

  const generateNumber = () => {
    if (numbers.length >= 100) return;
    let num: number;
    do {
      num = Math.floor(Math.random() * 100) + 1;
    } while (numbers.includes(num));
    const nextNumbers = [...numbers, num];
    setNumbers(nextNumbers);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ numbers: nextNumbers }),
      );
    } catch {
      // The current session still works when browser storage is unavailable.
    }
    speakNumber(num);
  };

  const resetGame = () => {
    setNumbers([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Reset the in-memory game even when browser APIs are unavailable.
    }
    stopAnnouncements();
    setConfirmReset(false);
  };

  return (
    <Card className="mx-auto w-full max-w-3xl shadow-lg">
      <CardHeader className="flex flex-col items-center">
        <CardTitle className="text-3xl font-bold">
          🎲 Housie Number Generator (1–100)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Select
            value={selectedVoice?.voiceURI ?? ""}
            onValueChange={(value) =>
              setSelectedVoice(
                voices.find((voice) => voice.voiceURI === value) ?? null,
              )
            }
            disabled={!speechAvailable || voices.length === 0}
          >
            <SelectTrigger className="w-72">
              <SelectValue
                placeholder={
                  speechAvailable ? "Select a voice" : "Voice unavailable"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              if (voiceEnabled) stopAnnouncements();
              setVoiceEnabled(!voiceEnabled);
            }}
            disabled={!speechAvailable}
            aria-pressed={speechAvailable ? voiceEnabled : undefined}
            aria-label="Voice announcements"
          >
            Voice {speechAvailable && voiceEnabled ? "on" : "off"}
          </Button>
        </div>
        {!speechAvailable && (
          <p className="text-sm text-muted-foreground">
            Voice announcements are unavailable; numbers will still be drawn
            silently.
          </p>
        )}
        <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-slate-900 font-mono text-7xl text-white">
          {numbers.at(-1) ?? "--"}
        </div>
        <div className="flex gap-4">
          <Button
            ref={nextButton}
            onClick={generateNumber}
            disabled={!storageReady || numbers.length >= 100}
            className="px-6 text-lg"
          >
            Next
          </Button>
          <Button
            ref={resetButton}
            variant="secondary"
            onClick={() => setConfirmReset(true)}
            disabled={numbers.length === 0}
            className="px-6 text-lg"
          >
            Reset
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-10 gap-2 text-center">
          {Array.from({ length: 100 }, (_, index) => index + 1).map(
            (number) => (
              <span
                key={number}
                className={`flex size-8 items-center justify-center rounded-md text-sm ${numbers.includes(number) ? "bg-green-600 text-white" : "bg-slate-200 text-slate-700"}`}
              >
                {number}
              </span>
            ),
          )}
        </div>
      </CardContent>
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent
          initialFocus={cancelReset}
          finalFocus={() =>
            resetButton.current?.disabled
              ? nextButton.current
              : resetButton.current
          }
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this game?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the called numbers and the saved draw from this
              browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelReset}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={resetGame}>
              Reset game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
