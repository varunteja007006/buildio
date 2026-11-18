"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { MessageCircleMore, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useUserStore } from "@/lib/store/user.store";

interface ChatBoxProps {
  roomCode: string;
}

export function ChatBox({ roomCode }: ChatBoxProps) {
  const { user, userToken } = useUserStore();
  const messages = useQuery(api.chat.getMessages, { roomCode });
  const sendMessage = useMutation(api.chat.sendMessage);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && messages && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    try {
      await sendMessage({
        roomCode,
        userToken,
        message: inputValue,
      });
      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-md bg-background overflow-hidden shadow-sm">
      <p className="p-2 text-sm text-accent-foreground/60 flex flex-row items-center border-b">
        <MessageCircleMore className="size-4 mr-2" /> Chat
      </p>
      {messages && messages.length > 0 && (
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full p-2">
            <div className="flex flex-col gap-2">
              {messages?.map((msg) => {
                const isMe = user?.success === true && msg.userId === user.id;
                const isGuess = msg.isGuess;

                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex flex-col max-w-[95%]",
                      isMe ? "self-end items-end" : "self-start items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "px-1.5 py-1 rounded-lg text-xs break-all",
                        isGuess
                          ? "bg-green-500 text-white font-bold"
                          : isMe
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none",
                      )}
                    >
                      {!isMe && !isGuess && (
                        <span className="block text-[10px] font-bold opacity-70 mb-0.5">
                          {msg.sender}
                        </span>
                      )}
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="p-1 border-t flex gap-1">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your guess here..."
          className="h-8 text-sm"
        />
        <Button size="icon" className="h-8 w-8" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
