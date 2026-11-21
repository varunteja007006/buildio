"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { MessageCircle, Send } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { getGameError } from "@/lib/game-error";

export function ChatBox({
  roomCode,
  turnKey,
  canGuess,
  participants,
}: {
  roomCode: string;
  turnKey: string | null;
  canGuess: boolean;
  participants: ReactNode;
}) {
  const { user, userToken } = useUserStore();
  const messages = useQuery(api.chat.getMessages, { roomCode, userToken });
  const sendMessage = useMutation(api.chat.sendMessage);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<{
    turnKey: string | null;
    message: string;
  }>();
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const follow = useRef(true);

  useEffect(() => {
    const area = scrollRef.current;
    if (follow.current && area) area.scrollTop = area.scrollHeight;
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = inputValue.trim();
    if (!message || pending) return;

    setPending(true);
    setFeedback(undefined);
    try {
      const result = await sendMessage({
        roomCode,
        userToken,
        message,
        turnKey,
      });
      setInputValue((draft) => (draft.trim() === message ? "" : draft));
      follow.current = true;
      if (result === "hidden") {
        setFeedback({ turnKey, message: "The answer was kept out of chat." });
      }
    } catch (cause) {
      setFeedback({
        turnKey,
        message: getGameError(cause, "Could not send your message. Try again."),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-(--scribble-panel)"
      aria-label="Room chat"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-2 lg:px-3 lg:py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle
            className="size-4 text-teal-700 dark:text-teal-300"
            aria-hidden
          />
          Chat
        </h2>
        <div className="lg:hidden">{participants}</div>
      </header>
      <form
        className="shrink-0 border-b p-2 lg:order-last lg:border-t lg:border-b-0"
        onSubmit={handleSend}
      >
        {feedback?.turnKey === turnKey && (
          <p role="status" className="mb-1 px-1 text-xs text-muted-foreground">
            {feedback.message}
          </p>
        )}
        <div className="flex gap-1.5">
          <Input
            aria-label={canGuess ? "Guess" : "Message"}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={canGuess ? "Type your guess…" : "Write a message…"}
            maxLength={1000}
            className="min-w-0 bg-background/50 text-base lg:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            aria-label={canGuess ? "Send guess" : "Send message"}
            disabled={pending || !inputValue.trim()}
            className="bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-300 dark:text-zinc-950 dark:hover:bg-teal-200"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
      <div
        ref={scrollRef}
        role="log"
        aria-label="Chat messages"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
        onScroll={(event) => {
          const area = event.currentTarget;
          follow.current =
            area.scrollHeight - area.scrollTop - area.clientHeight < 40;
        }}
      >
        {messages?.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
        {messages?.map((message) => {
          const mine = user?.success === true && message.userId === user.id;
          return (
            <div
              key={message._id}
              className={cn(
                "w-fit max-w-[95%] wrap-break-word rounded-md px-2 py-1 text-sm",
                message.isGuess
                  ? "bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-200"
                  : mine
                    ? "ml-auto bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
                    : "bg-muted",
              )}
            >
              {message.isGuess ? (
                <>{message.sender} guessed the drawing!</>
              ) : (
                <>
                  {!mine && (
                    <p className="text-xs font-semibold">{message.sender}</p>
                  )}
                  {message.message}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
