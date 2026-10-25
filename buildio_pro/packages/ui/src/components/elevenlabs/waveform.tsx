"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

import { cn } from "@workspace/ui/lib/utils";

import {
  drawBar,
  drawFadeEdges,
  getComputedBarColor,
  heightToStyle,
  observeCanvasResize,
} from "./waveform-canvas.js";

export type WaveformProps = HTMLAttributes<HTMLDivElement> & {
  data?: number[];
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  active?: boolean;
  onBarClick?: (index: number, value: number) => void;
};

export const Waveform = ({
  data = [],
  barWidth = 4,
  barHeight: baseBarHeight = 4,
  barGap = 2,
  barRadius = 2,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  onBarClick,
  className,
  ...props
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heightStyle = heightToStyle(height);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderWaveform = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor = getComputedBarColor(canvas, barColor);

      const barCount = Math.floor(rect.width / (barWidth + barGap));
      const centerY = rect.height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * data.length);
        const value = data[dataIndex] || 0;
        const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
        const x = i * (barWidth + barGap);
        const y = centerY - barHeight / 2;

        ctx.fillStyle = computedBarColor;
        ctx.globalAlpha = 0.3 + value * 0.7;
        drawBar(ctx, x, y, barWidth, barHeight, barRadius);
      }

      if (fadeEdges && rect.width > 0) {
        drawFadeEdges(ctx, rect.width, rect.height, fadeWidth);
      }

      ctx.globalAlpha = 1;
    };

    const disconnect = observeCanvasResize(canvas, container, renderWaveform);
    renderWaveform();

    return disconnect;
  }, [
    data,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
  ]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onBarClick) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const barIndex = Math.floor(x / (barWidth + barGap));
    const dataIndex = Math.floor(
      (barIndex * data.length) / Math.floor(rect.width / (barWidth + barGap)),
    );

    if (dataIndex >= 0 && dataIndex < data.length) {
      onBarClick(dataIndex, data[dataIndex] ?? 0);
    }
  };

  return (
    <div
      className={cn("relative", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      {...props}
    >
      <canvas
        className="block h-full w-full"
        onClick={handleClick}
        ref={canvasRef}
      />
    </div>
  );
};
