"use client";

import { useEffect, type RefObject } from "react";

export type LiveMicrophoneRecorderOptions = {
  active: boolean;
  fftSize: number;
  smoothingTimeConstant: number;
  enableAudioPlayback: boolean;
  onError?: (error: Error) => void;
  onReset?: () => void;
  historyRef: RefObject<number[]>;
  setDragOffset?: (offset: number) => void;
  analyserRef: RefObject<AnalyserNode | null>;
  audioContextRef: RefObject<AudioContext | null>;
  streamRef: RefObject<MediaStream | null>;
  mediaRecorderRef: RefObject<MediaRecorder | null>;
  audioChunksRef: RefObject<Blob[]>;
  audioBufferRef: RefObject<AudioBuffer | null>;
  sourceNodeRef: RefObject<AudioBufferSourceNode | null>;
  scrubSourceRef: RefObject<AudioBufferSourceNode | null>;
};

export function useLiveMicrophoneRecorder(
  options: LiveMicrophoneRecorderOptions,
) {
  const {
    active,
    fftSize,
    smoothingTimeConstant,
    enableAudioPlayback,
    onError,
    onReset,
    historyRef,
    setDragOffset,
    analyserRef,
    audioContextRef,
    streamRef,
    mediaRecorderRef,
    audioChunksRef,
    audioBufferRef,
    sourceNodeRef,
    scrubSourceRef,
  } = options;

  const processAudioBlob = async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      if (audioContextRef.current) {
        const audioBuffer =
          await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
      }
    } catch (error) {
      console.error("Error processing audio:", error);
    }
  };

  useEffect(() => {
    if (!active) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Process recorded audio when stopping
      if (enableAudioPlayback && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        processAudioBlob(audioBlob);
      }
      return;
    }

    setDragOffset?.(0);
    historyRef.current = [];
    audioChunksRef.current = [];
    audioBufferRef.current = null;
    onReset?.();

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

        if (enableAudioPlayback) {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start(100);
        }
      } catch (error) {
        onError?.(error as Error);
      }
    };

    setupMicrophone();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (scrubSourceRef.current) {
        scrubSourceRef.current.stop();
      }
    };
  }, [
    active,
    fftSize,
    smoothingTimeConstant,
    onError,
    setDragOffset,
    enableAudioPlayback,
    historyRef,
    onReset,
  ]);
}
