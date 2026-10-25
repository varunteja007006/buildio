"use client";

import { useEffect, useRef, type RefObject } from "react";

import { drawBar, getComputedBarColor } from "./waveform-canvas.js";

export type RecordingRenderOptions = {
  recording: boolean;
  recordedData: number[];
  viewPosition: number;
  isRecordingComplete: boolean;
  sensitivity: number;
  updateRate: number;
  showHandle: boolean;
  barWidth: number;
  baseBarHeight: number;
  barGap: number;
  barRadius: number;
  barColor?: string;
  recordingDataRef: RefObject<number[]>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  analyserRef: RefObject<AnalyserNode | null>;
};

export function useRecordingRender(options: RecordingRenderOptions) {
  const {
    recording,
    recordedData,
    viewPosition,
    isRecordingComplete,
    sensitivity,
    updateRate,
    showHandle,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    recordingDataRef,
    canvasRef,
    analyserRef,
  } = options;

  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = (currentTime: number) => {
      if (recording && currentTime - lastUpdateRef.current > updateRate) {
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

          recordingDataRef.current.push(Math.min(1, Math.max(0.05, average)));
        }
      }

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor = getComputedBarColor(canvas, barColor);

      const dataToRender = recording ? recordingDataRef.current : recordedData;

      if (dataToRender.length > 0) {
        const step = barWidth + barGap;
        const barsVisible = Math.floor(rect.width / step);
        const centerY = rect.height / 2;

        let startIndex = 0;
        if (!recording && isRecordingComplete) {
          const totalBars = dataToRender.length;
          if (totalBars > barsVisible) {
            startIndex = Math.floor((totalBars - barsVisible) * viewPosition);
          }
        } else if (recording) {
          startIndex = Math.max(0, dataToRender.length - barsVisible);
        }

        for (
          let i = 0;
          i < barsVisible && startIndex + i < dataToRender.length;
          i++
        ) {
          const value = dataToRender[startIndex + i] || 0.1;
          const x = i * step;
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.7);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.3 + value * 0.7;

          drawBar(ctx, x, y, barWidth, barHeight, barRadius);
        }

        if (!recording && isRecordingComplete && showHandle) {
          const indicatorX = rect.width * viewPosition;

          ctx.strokeStyle = computedBarColor;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(indicatorX, 0);
          ctx.lineTo(indicatorX, rect.height);
          ctx.stroke();
          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(indicatorX, centerY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    recording,
    recordedData,
    viewPosition,
    isRecordingComplete,
    sensitivity,
    updateRate,
    showHandle,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    recordingDataRef,
    canvasRef,
    analyserRef,
  ]);
}
