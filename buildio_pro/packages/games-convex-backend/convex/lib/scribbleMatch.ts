import { ConvexError } from "convex/values";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const DEFAULT_WORDS = [
  "cat",
  "dog",
  "house",
  "tree",
  "sun",
  "car",
  "book",
  "phone",
  "computer",
  "flower",
  "bird",
  "fish",
  "mountain",
  "ocean",
  "star",
];

const REVEAL_MS = 3500;

export function getMatch(ctx: QueryCtx, roomId: Id<"rooms">) {
  return ctx.db
    .query("scribble_matches")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .unique();
}

export function getDrawer(match: Doc<"scribble_matches">) {
  return match.players[match.turnIndex % match.players.length]!;
}

export function getTurnKey(match: Doc<"scribble_matches">) {
  return `${match._id}:${match.turnIndex}`;
}

export function normalizeGuess(message: string) {
  return message.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildPrompts(words: string[], count: number) {
  const result: string[] = [];
  while (result.length < count) {
    const deck = [...words];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j]!, deck[i]!];
    }
    if (deck.length > 1 && deck[0] === result[result.length - 1]) {
      [deck[0], deck[1]] = [deck[1]!, deck[0]!];
    }
    result.push(...deck.slice(0, count - result.length));
  }
  return result;
}

export async function schedulePhase(
  ctx: MutationCtx,
  match: {
    id: Id<"scribble_matches">;
    turnIndex: number;
    phase: "drawing" | "reveal";
    endsAt: number;
  },
): Promise<void> {
  await ctx.scheduler.runAt(
    match.endsAt,
    internal.scribbleMatch.advance,
    match,
  );
}

export async function revealTurn(
  ctx: MutationCtx,
  match: Doc<"scribble_matches">,
): Promise<void> {
  const endsAt = Date.now() + REVEAL_MS;
  await ctx.db.patch(match._id, { phase: "reveal", endsAt });
  await schedulePhase(ctx, {
    id: match._id,
    turnIndex: match.turnIndex,
    phase: "reveal",
    endsAt,
  });
}

export async function recordGuess(
  ctx: MutationCtx,
  match: Doc<"scribble_matches">,
  userId: Id<"users">,
) {
  if (
    userId === getDrawer(match).id ||
    !match.players.some((player) => player.id === userId) ||
    match.guessed.includes(userId)
  ) {
    return false;
  }

  const guessed = [...match.guessed, userId];
  await ctx.db.patch(match._id, {
    guessed,
    scores: { ...match.scores, [userId]: (match.scores[userId] ?? 0) + 1 },
  });
  if (guessed.length === match.players.length - 1) {
    await revealTurn(ctx, match);
  }
  return true;
}

export async function requireDrawingTurn(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">,
  canvasId: string,
) {
  const match = await getMatch(ctx, roomId);
  if (
    !match ||
    match.canvasId !== canvasId ||
    match.phase !== "drawing" ||
    match.endsAt <= Date.now() ||
    getDrawer(match).id !== userId
  ) {
    throw new ConvexError("This drawing turn is no longer available to you.");
  }
  return match;
}
