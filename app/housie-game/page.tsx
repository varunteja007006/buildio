"use client";
import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card";

interface VoiceOption extends SpeechSynthesisVoice {}

export default function HousieGenerator() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null | undefined>(null);

  // Load system voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      const defaultVoice =
        v.find((voice) => voice.lang.toLowerCase().includes("en-in")) || v[0];
      setSelectedVoice(defaultVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speakNumber = (num: number) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(`Number ${num}`);
    utterance.rate = 0.9;
    utterance.voice = selectedVoice || null;
    window.speechSynthesis.speak(utterance);
  };

  const generateNumber = () => {
    if (numbers.length >= 100) return;
    let num: number;
    do {
      num = Math.floor(Math.random() * 100) + 1;
    } while (numbers.includes(num));
    setNumbers((prev) => [...prev, num]);
    setCurrent(num);
    speakNumber(num);
  };

  const resetGame = () => {
    setNumbers([]);
    setCurrent(null);
    window.speechSynthesis.cancel();
  };

  return (
      <Card className="w-full max-w-3xl shadow-lg mx-auto">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-3xl font-bold">
            🎲 Housie Number Generator (1–100)
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6">
          {/* Voice selection */}
          <Select
            value={selectedVoice?.name || ""}
            onValueChange={(val) =>
              setSelectedVoice(voices.find((v) => v.name === val) || null)
            }
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice, i) => (
                <SelectItem key={i} value={voice.name}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Current number */}
          <div className="text-7xl font-mono bg-slate-900 text-white rounded-2xl w-36 h-36 flex items-center justify-center">
            {current ?? "--"}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={generateNumber}
              disabled={numbers.length >= 100}
              className="text-lg px-6"
            >
              Next
            </Button>
            <Button
              variant="secondary"
              onClick={resetGame}
              className="text-lg px-6"
            >
              Reset
            </Button>
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-10 gap-2 text-center mt-6">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                  numbers.includes(n)
                    ? "bg-green-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
  );
}
