"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseMicrophoneStreamOptions = {
  active: boolean;
  deviceId?: string;
  fftSize: number;
  smoothingTimeConstant: number;
  historyRef: RefObject<number[]>;
  onError?: (error: Error) => void;
  onStreamReady?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
};

export function useMicrophoneStream({
  active,
  deviceId,
  fftSize,
  smoothingTimeConstant,
  historyRef,
  onError,
  onStreamReady,
  onStreamEnd,
}: UseMicrophoneStreamOptions) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  // Handle microphone setup and teardown
  useEffect(() => {
    const teardown = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        onStreamEnd?.();
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };

    if (!active) {
      teardown();
      return;
    }

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        });
        streamRef.current = stream;
        onStreamReady?.(stream);

        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        // Clear history when starting
        historyRef.current = [];
      } catch (error) {
        onError?.(error as Error);
      }
    };

    setupMicrophone();

    return teardown;
  }, [
    active,
    deviceId,
    fftSize,
    smoothingTimeConstant,
    onError,
    onStreamReady,
    onStreamEnd,
  ]);

  return { analyserRef };
}
