import {
  useConversationControls,
  useConversationInput,
  useConversationStatus,
} from "@elevenlabs/react";
import * as React from "react";

interface UseConversationBarStateParams {
  agentId: string;
  onSendMessage?: (message: string) => void;
}

export function useConversationBarState({
  agentId,
  onSendMessage,
}: UseConversationBarStateParams) {
  const { status } = useConversationStatus();
  const { startSession, endSession, sendUserMessage, sendContextualUpdate } =
    useConversationControls();
  const { isMuted, setMuted } = useConversationInput();
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  const [textInput, setTextInput] = React.useState("");
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  const isConnected = status === "connected";
  const isIdle = status === "disconnected" || status === "error";

  const getMicStream = React.useCallback(async () => {
    if (mediaStreamRef.current) return mediaStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    return stream;
  }, []);

  const startConversation = React.useCallback(async () => {
    try {
      await getMicStream();

      startSession({
        agentId,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  }, [getMicStream, agentId, startSession]);

  const handleEndSession = React.useCallback(() => {
    endSession();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, [endSession]);

  const toggleMute = React.useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  const toggleKeyboard = React.useCallback(() => {
    setKeyboardOpen((v) => !v);
  }, []);

  const handleStartOrEnd = React.useCallback(() => {
    if (status === "connected" || status === "connecting") {
      handleEndSession();
    } else if (status === "disconnected" || status === "error") {
      startConversation();
    }
  }, [status, handleEndSession, startConversation]);

  const handleSendText = React.useCallback(() => {
    if (!textInput.trim()) return;

    const messageToSend = textInput;
    sendUserMessage(messageToSend);
    setTextInput("");
    onSendMessage?.(messageToSend);
  }, [sendUserMessage, textInput, onSendMessage]);

  const handleTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTextInput(value);

      if (value.trim() && isConnected) {
        sendContextualUpdate(value);
      }
    },
    [sendContextualUpdate, isConnected],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText],
  );

  React.useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    status,
    isConnected,
    isIdle,
    isMuted,
    keyboardOpen,
    textInput,
    toggleMute,
    toggleKeyboard,
    handleStartOrEnd,
    handleSendText,
    handleTextChange,
    handleKeyDown,
  };
}
