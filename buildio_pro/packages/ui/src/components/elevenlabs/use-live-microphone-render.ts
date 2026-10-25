"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  drawBar,
  drawFadeEdges,
  getComputedBarColor,
} from "./waveform-canvas.js";

export type LiveMicrophoneRenderOptions = {
  active: boolean;
  sensitivity: number;
  updateRate: number;
  historySize: number;
  barWidth: number;
  baseBarHeight: number;
  barGap: number;
  barRadius: number;
  barColor?: string;
  fadeEdges: boolean;
  fadeWidth: number;
  dragOffset: number;
  playbackPosition: number | null;
  historyRef: RefObject<number[]>;
  analyserRef: RefObject<AnalyserNode | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export function useLiveMicrophoneRender(options: LiveMicrophoneRenderOptions) {
  const {
    active,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    dragOffset,
    playbackPosition,
    historyRef,
    analyserRef,
    canvasRef,
  } = options;

  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!active && historyRef.current.length === 0 && playbackPosition === null)
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = (currentTime: number) => {
      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime;

        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount,
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (const value of dataArray) {
            sum += value;
          }
          const average = (sum / dataArray.length / 255) * sensitivity;

          historyRef.current.push(Math.min(1, Math.max(0.05, average)));

          if (historyRef.current.length > historySize) {
            historyRef.current.shift();
          }
        }
      }

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor = getComputedBarColor(canvas, barColor);

      const step = barWidth + barGap;
      const barCount = Math.floor(rect.width / step);
      const centerY = rect.height / 2;

      const dataToRender = historyRef.current;

      if (dataToRender.length > 0) {
        const offsetInBars = Math.floor(dragOffset / step);

        for (let i = 0; i < barCount; i++) {
          let dataIndex;

          if (active) {
            dataIndex = dataToRender.length - 1 - i;
          } else {
            dataIndex = Math.max(
              0,
              Math.min(
                dataToRender.length - 1,
                dataToRender.length - 1 - i - Math.floor(offsetInBars),
              ),
            );
          }

          if (dataIndex >= 0 && dataIndex < dataToRender.length) {
            const value = dataToRender[dataIndex];
            if (value !== undefined) {
              const x = rect.width - (i + 1) * step;
              const barHeight = Math.max(
                baseBarHeight,
                value * rect.height * 0.7,
              );
              const y = centerY - barHeight / 2;

              ctx.fillStyle = computedBarColor;
              ctx.globalAlpha = 0.3 + value * 0.7;

              drawBar(ctx, x, y, barWidth, barHeight, barRadius);
            }
          }
        }
      }

      if (fadeEdges) {
        drawFadeEdges(ctx, rect.width, rect.height, fadeWidth);
      }

      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    if (active || historyRef.current.length > 0 || playbackPosition !== null) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    active,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    dragOffset,
    playbackPosition,
    historyRef,
    analyserRef,
    canvasRef,
  ]);
}
