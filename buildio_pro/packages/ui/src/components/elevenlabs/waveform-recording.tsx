"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";

import { useRecordingRender } from "./use-recording-render.js";
import { heightToStyle, observeCanvasResize } from "./waveform-canvas.js";
import type { WaveformProps } from "./waveform.js";

export type RecordingWaveformProps = Omit<
  WaveformProps,
  "data" | "onBarClick"
> & {
  recording?: boolean;
  fftSize?: number;
  smoothingTimeConstant?: number;
  sensitivity?: number;
  onError?: (error: Error) => void;
  onRecordingComplete?: (data: number[]) => void;
  updateRate?: number;
  showHandle?: boolean;
};

export const RecordingWaveform = ({
  recording = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  onRecordingComplete,
  updateRate = 50,
  showHandle = true,
  barWidth = 3,
  barHeight: baseBarHeight = 4,
  barGap = 1,
  barRadius = 1,
  barColor,
  height = 128,
  className,
  ...props
}: RecordingWaveformProps) => {
  const [recordedData, setRecordedData] = useState<number[]>([]);
  const [viewPosition, setViewPosition] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecordingComplete, setIsRecordingComplete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recordingDataRef = useRef<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const heightStyle = heightToStyle(height);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    return observeCanvasResize(canvas, container);
  }, []);

  useEffect(() => {
    if (!recording) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }

      if (recordingDataRef.current.length > 0) {
        setRecordedData([...recordingDataRef.current]);
        setIsRecordingComplete(true);
        onRecordingComplete?.(recordingDataRef.current);
      }
      return;
    }

    setIsRecordingComplete(false);
    recordingDataRef.current = [];
    setRecordedData([]);
    setViewPosition(1);

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const audioContext = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (error) {
        onError?.(error as Error);
      }
    };

    setupMicrophone();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [recording, fftSize, smoothingTimeConstant, onError, onRecordingComplete]);

  useRecordingRender({
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
  });

  const handleScrub = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container || recording || !isRecordingComplete) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const position = x / rect.width;

      setViewPosition(position);
    },
    [recording, isRecordingComplete],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (recording || !isRecordingComplete) return;

    e.preventDefault();
    setIsDragging(true);
    handleScrub(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleScrub(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleScrub]);

  return (
    <div
      aria-label={
        isRecordingComplete && !recording
          ? "Drag to scrub through recording"
          : undefined
      }
      aria-valuenow={
        isRecordingComplete && !recording ? viewPosition * 100 : undefined
      }
      aria-valuemin={isRecordingComplete && !recording ? 0 : undefined}
      aria-valuemax={isRecordingComplete && !recording ? 100 : undefined}
      className={cn(
        "relative flex items-center",
        isRecordingComplete && !recording && "cursor-pointer",
        className,
      )}
      onMouseDown={handleMouseDown}
      ref={containerRef}
      role={isRecordingComplete && !recording ? "slider" : undefined}
      style={{ height: heightStyle }}
      tabIndex={isRecordingComplete && !recording ? 0 : undefined}
      {...props}
    >
      <canvas className="block h-full w-full" ref={canvasRef} />
    </div>
  );
};
