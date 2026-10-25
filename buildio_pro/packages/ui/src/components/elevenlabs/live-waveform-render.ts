"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseWaveformRendererOptions = {
  active: boolean;
  processing: boolean;
  sensitivity: number;
  updateRate: number;
  historySize: number;
  barWidth: number;
  barHeight: number;
  barGap: number;
  barRadius: number;
  barColor?: string;
  fadeEdges: boolean;
  fadeWidth: number;
  mode: "scrolling" | "static";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  analyserRef: RefObject<AnalyserNode | null>;
  historyRef: RefObject<number[]>;
  staticBarsRef: RefObject<number[]>;
  lastActiveDataRef: RefObject<number[]>;
  needsRedrawRef: RefObject<boolean>;
  gradientCacheRef: RefObject<CanvasGradient | null>;
  lastWidthRef: RefObject<number>;
};

export function useWaveformRenderer({
  active,
  processing,
  sensitivity,
  updateRate,
  historySize,
  barWidth,
  barHeight: baseBarHeight,
  barGap,
  barRadius,
  barColor,
  fadeEdges,
  fadeWidth,
  mode,
  canvasRef,
  analyserRef,
  historyRef,
  staticBarsRef,
  lastActiveDataRef,
  needsRedrawRef,
  gradientCacheRef,
  lastWidthRef,
}: UseWaveformRendererOptions) {
  const lastUpdateRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const animate = (currentTime: number) => {
      // Render waveform
      const rect = canvas.getBoundingClientRect();

      // Update audio data if active
      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime;

        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount,
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          if (mode === "static") {
            // For static mode, update bars in place
            const startFreq = Math.floor(dataArray.length * 0.05);
            const endFreq = Math.floor(dataArray.length * 0.4);
            const relevantData = dataArray.slice(startFreq, endFreq);

            const barCount = Math.floor(rect.width / (barWidth + barGap));
            const halfCount = Math.floor(barCount / 2);
            const newBars: number[] = [];

            // Mirror the data for symmetric display
            for (let i = halfCount - 1; i >= 0; i--) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length,
              );
              const value = Math.min(
                1,
                ((relevantData[dataIndex] ?? 0) / 255) * sensitivity,
              );
              newBars.push(Math.max(0.05, value));
            }

            for (let i = 0; i < halfCount; i++) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length,
              );
              const value = Math.min(
                1,
                ((relevantData[dataIndex] ?? 0) / 255) * sensitivity,
              );
              newBars.push(Math.max(0.05, value));
            }

            staticBarsRef.current = newBars;
            lastActiveDataRef.current = newBars;
          } else {
            // Scrolling mode - original behavior
            let sum = 0;
            const startFreq = Math.floor(dataArray.length * 0.05);
            const endFreq = Math.floor(dataArray.length * 0.4);
            const relevantData = dataArray.slice(startFreq, endFreq);

            for (let i = 0; i < relevantData.length; i++) {
              sum += relevantData[i] ?? 0;
            }
            const average = (sum / relevantData.length / 255) * sensitivity;

            // Add to history
            historyRef.current.push(Math.min(1, Math.max(0.05, average)));
            lastActiveDataRef.current = [...historyRef.current];

            // Maintain history size
            if (historyRef.current.length > historySize) {
              historyRef.current.shift();
            }
          }
          needsRedrawRef.current = true;
        }
      }

      // Only redraw if needed
      if (!needsRedrawRef.current && !active) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      needsRedrawRef.current = active;
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor =
        barColor ||
        (() => {
          const style = getComputedStyle(canvas);
          // Try to get the computed color value directly
          const color = style.color;
          return color || "#000";
        })();

      const step = barWidth + barGap;
      const barCount = Math.floor(rect.width / step);
      const centerY = rect.height / 2;

      // Draw bars based on mode
      if (mode === "static") {
        // Static mode - bars in fixed positions
        const dataToRender = processing
          ? staticBarsRef.current
          : active
            ? staticBarsRef.current
            : staticBarsRef.current.length > 0
              ? staticBarsRef.current
              : [];

        for (let i = 0; i < barCount && i < dataToRender.length; i++) {
          const value = dataToRender[i] || 0.1;
          const x = i * step;
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.4 + value * 0.6;

          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      } else {
        // Scrolling mode - original behavior
        for (let i = 0; i < barCount && i < historyRef.current.length; i++) {
          const dataIndex = historyRef.current.length - 1 - i;
          const value = historyRef.current[dataIndex] || 0.1;
          const x = rect.width - (i + 1) * step;
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.4 + value * 0.6;

          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }

      // Apply edge fading
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        // Cache gradient if width hasn't changed
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
          const fadePercent = Math.min(0.3, fadeWidth / rect.width);

          // destination-out: removes destination where source alpha is high
          // We want: fade edges out, keep center solid
          // Left edge: start opaque (1) = remove, fade to transparent (0) = keep
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
          // Center stays transparent = keep everything
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
          // Right edge: fade from transparent (0) = keep to opaque (1) = remove
          gradient.addColorStop(1, "rgba(255,255,255,1)");

          gradientCacheRef.current = gradient;
          lastWidthRef.current = rect.width;
        }

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradientCacheRef.current;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    active,
    processing,
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
    mode,
  ]);
}
