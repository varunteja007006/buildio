"use client";

/**
 * Visual demos for the ElevenLabs component family (orb, matrix, waveforms).
 * Everything renders with static data or built-in fake animation — no
 * microphone access (getUserMedia), no captured AudioContext and no
 * ElevenLabs API key.
 */

import { BarVisualizer } from "@workspace/ui/components/elevenlabs/bar-visualizer";
import { LiveWaveform } from "@workspace/ui/components/elevenlabs/live-waveform";
import {
  Matrix,
  chevronLeft,
  loader,
  pulse,
  wave,
} from "@workspace/ui/components/elevenlabs/matrix";
import { Orb, type AgentState } from "@workspace/ui/components/elevenlabs/orb";
import { Waveform } from "@workspace/ui/components/elevenlabs/waveform";
import { ScrollingWaveform } from "@workspace/ui/components/elevenlabs/waveform-scrolling";
import { StaticWaveform } from "@workspace/ui/components/elevenlabs/waveform-static";

const orbs: Array<{
  state: AgentState;
  colors: [string, string];
  seed: number;
}> = [
  { state: null, colors: ["#CADCFC", "#A0B9D1"], seed: 7 },
  { state: "listening", colors: ["#B8D8FF", "#7E8EF1"], seed: 23 },
  { state: "talking", colors: ["#FFD6A5", "#E8798A"], seed: 42 },
];

export function OrbDemo() {
  return (
    <div className="grid w-full grid-cols-3 gap-3">
      {orbs.map((orb) => (
        <div
          key={orb.seed}
          className="bg-background h-40 overflow-hidden rounded-md border"
        >
          <Orb agentState={orb.state} colors={orb.colors} seed={orb.seed} />
        </div>
      ))}
    </div>
  );
}

const barStates = [
  { state: "listening" as const, seed: "listening" },
  { state: "thinking" as const, seed: "thinking" },
  { state: "speaking" as const, seed: "speaking" },
];

export function BarVisualizerDemo() {
  return (
    <div className="w-full space-y-3">
      {barStates.map((bar) => (
        <BarVisualizer
          key={bar.seed}
          state={bar.state}
          demo={true}
          barCount={12}
          className="h-20"
        />
      ))}
    </div>
  );
}

export function MatrixDemo() {
  return (
    <div className="bg-background flex h-40 flex-wrap items-center justify-center gap-6 rounded-md border p-4">
      <Matrix rows={7} cols={7} frames={pulse} fps={10} size={8} gap={2} />
      <Matrix rows={7} cols={7} frames={loader} fps={12} size={8} gap={2} />
      <Matrix rows={7} cols={7} frames={wave} fps={12} size={8} gap={2} />
      <Matrix
        rows={5}
        cols={5}
        pattern={chevronLeft}
        size={8}
        gap={2}
        className="text-amber-500"
      />
      <Matrix
        rows={7}
        cols={7}
        mode="vu"
        levels={[0.2, 0.5, 0.85, 1, 0.7, 0.4, 0.15]}
        size={8}
        gap={2}
        className="text-emerald-500"
      />
    </div>
  );
}

export function WaveformDemo() {
  return (
    <div className="w-full space-y-3">
      <div className="bg-background overflow-hidden rounded-md border p-3">
        <StaticWaveform bars={48} seed={17} height={56} />
      </div>
      <div className="bg-background overflow-hidden rounded-md border p-3">
        <ScrollingWaveform speed={40} height={56} />
      </div>
      <div className="bg-background overflow-hidden rounded-md border p-3">
        <Waveform
          data={[0.3, 0.7, 0.45, 0.9, 0.55, 0.25, 0.8, 0.6, 0.35, 0.75]}
          height={40}
        />
      </div>
    </div>
  );
}

export function LiveWaveformDemo() {
  return (
    <div className="w-full space-y-3">
      <div className="bg-background h-24 overflow-hidden rounded-md border p-3">
        <LiveWaveform active={false} processing={false} height={72} />
      </div>
      <div className="bg-background h-24 overflow-hidden rounded-md border p-3">
        <LiveWaveform active={false} processing={true} height={72} />
      </div>
    </div>
  );
}
