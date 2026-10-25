"use client";

import { useMemo } from "react";

import { Waveform, type WaveformProps } from "./waveform.js";

export type StaticWaveformProps = WaveformProps & {
  bars?: number;
  seed?: number;
};

export const StaticWaveform = ({
  bars = 40,
  seed = 42,
  ...props
}: StaticWaveformProps) => {
  const data = useMemo(() => {
    const random = (seedValue: number) => {
      const x = Math.sin(seedValue) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: bars }, (_, i) => 0.2 + random(seed + i) * 0.6);
  }, [bars, seed]);

  return <Waveform data={data} {...props} />;
};
