"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useState } from "react";

import { upsertMessageFeedback } from "@/api/chat/api";
import { CharCount } from "@/components/char-count";
import { MAX_CHAT_FEEDBACK_LENGTH } from "@/lib/chat/constants";

/**
 * Thumbs up/down + optional comment feedback on an assistant message.
 * Re-rating upserts the single feedback row for the message.
 */
export function MessageFeedback({
  threadId,
  messageId,
}: {
  threadId: string;
  messageId: string;
}) {
  const [choice, setChoice] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [error, setError] = useState(false);

  const choose = async (rating: "up" | "down") => {
    if (rating === "down") {
      setPending(true);
      setSaved(false);
      try {
        await upsertMessageFeedback(threadId, messageId, { rating });
        setChoice(rating);
        setSaved(true);
        setComment("");
        setError(false);
        setFeedbackOpen(true);
      } catch {
        // Silent: feedback is best-effort; user can retry.
      } finally {
        setPending(false);
      }
      return;
    }

    const next = choice === rating ? null : rating;
    setChoice(next);
    setSaved(false);
    if (!next) return;
    setPending(true);
    try {
      await upsertMessageFeedback(threadId, messageId, { rating: next });
      setSaved(true);
    } catch {
      // Silent: feedback is best-effort; user can retry.
    } finally {
      setPending(false);
    }
  };

  const saveFeedback = async () => {
    setPending(true);
    setError(false);
    try {
      await upsertMessageFeedback(threadId, messageId, {
        rating: "down",
        comment: comment.trim() || undefined,
      });
      setChoice("down");
      setSaved(true);
      setFeedbackOpen(false);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1 px-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Button
          variant={choice === "up" ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => choose("up")}
          disabled={pending}
          aria-label="Good response"
        >
          <ThumbsUpIcon />
        </Button>
        <Button
          variant={choice === "down" ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => choose("down")}
          disabled={pending}
          aria-label="Bad response"
        >
          <ThumbsDownIcon />
        </Button>
        {saved ? <span className="text-xs">Feedback saved</span> : null}
      </div>
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
            <DialogDescription>
              Share an optional comment to help improve this response.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Your feedback (optional)"
            aria-label="Feedback comment"
            maxLength={MAX_CHAT_FEEDBACK_LENGTH}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <CharCount
            value={comment}
            maxLength={MAX_CHAT_FEEDBACK_LENGTH}
            className="text-right"
          />
          {error ? (
            <p className="text-sm text-destructive">
              Could not save feedback. Please try again.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={saveFeedback} disabled={pending}>
              {pending ? "Saving…" : "Save feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
