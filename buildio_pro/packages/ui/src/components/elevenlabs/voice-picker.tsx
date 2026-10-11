"use client";

import { Check, ChevronDown, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

export type VoicePickerVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
};

export type VoicePickerProps = {
  voices: VoicePickerVoice[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function VoicePicker({
  voices,
  value,
  onValueChange,
  placeholder = "Select a voice...",
  className,
  open: openProp,
  onOpenChange,
}: VoicePickerProps) {
  const [internalValue, setInternalValue] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedValue = value ?? internalValue;
  const open = openProp ?? internalOpen;
  const selectedVoice = voices.find(
    (voice) => voice.voice_id === selectedValue,
  );

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  function setOpen(nextOpen: boolean) {
    if (openProp === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function selectVoice(voiceId: string) {
    if (value === undefined) setInternalValue(voiceId);
    onValueChange?.(voiceId);
    audioRef.current?.pause();
    setPreviewingVoiceId(undefined);
    setOpen(false);
  }

  async function togglePreview(voice: VoicePickerVoice) {
    if (!voice.preview_url) return;
    if (previewingVoiceId === voice.voice_id) {
      audioRef.current?.pause();
      setPreviewingVoiceId(undefined);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(voice.preview_url);
    audioRef.current = audio;
    const clearPreview = () => {
      if (audioRef.current === audio) setPreviewingVoiceId(undefined);
    };
    audio.onended = clearPreview;
    audio.onerror = clearPreview;
    try {
      await audio.play();
      if (audioRef.current === audio) setPreviewingVoiceId(voice.voice_id);
    } catch {
      clearPreview();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{selectedVoice?.name ?? placeholder}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder="Search voices..." />
          <CommandList>
            <CommandEmpty>No voices found.</CommandEmpty>
            {voices.map((voice) => (
              <div
                key={voice.voice_id}
                className="flex items-center gap-1 pr-1"
              >
                <CommandItem
                  value={`${voice.name} ${voice.voice_id}`}
                  onSelect={() => selectVoice(voice.voice_id)}
                  className="min-w-0 flex-1"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-7 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500",
                      previewingVoiceId === voice.voice_id && "animate-pulse",
                    )}
                  />
                  <span className="truncate">{voice.name}</span>
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      selectedValue === voice.voice_id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${previewingVoiceId === voice.voice_id ? "Pause" : "Play"} ${voice.name} preview`}
                  disabled={!voice.preview_url}
                  onClick={() => void togglePreview(voice)}
                >
                  {previewingVoiceId === voice.voice_id ? <Pause /> : <Play />}
                </Button>
              </div>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
