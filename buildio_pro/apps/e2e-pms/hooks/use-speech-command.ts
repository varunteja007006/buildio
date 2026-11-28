import { useEffect, useRef, useState } from "react";

type Recognition = {
  start(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult:
    | ((event: {
        results: SpeechRecognitionResultList;
        resultIndex: number;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const noSpeech = "No speech was recognized. Try again or type your command.";
const speechFailed =
  "Speech recognition failed. Try again or type your command.";

export function useSpeechCommand() {
  const active = useRef<Recognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");

  useEffect(() => {
    return () => {
      const recognition = active.current;
      active.current = null;
      recognition?.abort();
    };
  }, []);

  function cancel() {
    const recognition = active.current;
    active.current = null;
    recognition?.abort();
    setIsListening(false);
    setSpeechMessage("");
  }

  function listen(onTranscript: (transcript: string) => void) {
    if (active.current) return;

    const { SpeechRecognition, webkitSpeechRecognition } =
      window as SpeechWindow;
    const Recognition = SpeechRecognition ?? webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechMessage(
        "Speech recognition is unavailable in this browser. Type your command instead.",
      );
      return;
    }

    const recognition = new Recognition();
    active.current = recognition;
    setIsListening(true);
    setSpeechMessage("Starting microphone…");

    function finish(message: string) {
      if (active.current !== recognition) return false;
      active.current = null;
      setIsListening(false);
      setSpeechMessage(message);
      return true;
    }

    recognition.onstart = () => {
      if (active.current === recognition) setSpeechMessage("Listening…");
    };
    recognition.onresult = ({ results, resultIndex }) => {
      const result = results[resultIndex];
      if (!result?.isFinal) return;
      const transcript = result[0]?.transcript.trim();
      if (finish(transcript ? "" : noSpeech) && transcript)
        onTranscript(transcript);
    };
    recognition.onerror = ({ error }) => {
      if (error === "not-allowed") {
        finish(
          "Microphone access was denied. Allow it in your browser or type your command.",
        );
      } else {
        finish(error === "no-speech" ? noSpeech : speechFailed);
      }
    };
    recognition.onend = () => finish(noSpeech);

    try {
      recognition.start();
    } catch {
      finish(speechFailed);
    }
  }

  return { listen, cancel, isListening, speechMessage };
}
