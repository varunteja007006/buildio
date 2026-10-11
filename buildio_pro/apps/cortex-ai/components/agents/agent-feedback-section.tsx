"use client";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useState } from "react";

import {
  useAgentFeedback,
  useUpsertAgentFeedback,
} from "@/api/agents/query";
import { CharCount } from "@/components/char-count";
import { FEEDBACK_COMMENT_MAX_LENGTH } from "@/lib/text-limits";

export function AgentFeedbackSection({ agentId }: { agentId: string }) {
  const { data, isLoading } = useAgentFeedback(agentId);
  const upsert = useUpsertAgentFeedback(agentId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = async () => {
    try {
      await upsert.mutateAsync({ rating, comment: comment.trim() });
      setComment("");
    } catch {
      // Surface via mutation error below.
    }
  };

  const feedback = data?.feedback ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Feedback
        </p>
        <span className="text-xs text-muted-foreground">
          {data?.total
            ? `${data.total} responses · average ${data.average?.toFixed(1)}/5`
            : "No feedback yet"}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="feedback-rating">Your rating (1–5)</Label>
          <select
            id="feedback-rating"
            className="border-input bg-background flex h-9 rounded-md border px-3 text-sm"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <Label htmlFor="feedback-comment">Comment (optional)</Label>
          <Textarea
            id="feedback-comment"
            rows={2}
            value={comment}
            maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
            onChange={(event) => setComment(event.target.value)}
          />
          <CharCount
            value={comment}
            maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
            className="text-right"
          />
        </div>
        <Button onClick={submit} disabled={upsert.isPending}>
          {upsert.isPending ? "Saving…" : "Submit feedback"}
        </Button>
      </div>
      {upsert.error ? (
        <p className="text-sm text-destructive">
          {upsert.error instanceof Error
            ? upsert.error.message
            : "Could not save feedback."}
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading feedback…</p>
      ) : feedback.length === 0 ? null : (
        <ul className="divide-y">
          {feedback.map((entry) => (
            <li key={entry.id} className="py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {entry.userName ?? "Workspace member"}
                </span>
                <span className="text-muted-foreground">{entry.rating}/5</span>
              </div>
              {entry.comment ? (
                <p className="text-sm text-muted-foreground">{entry.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}