import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import {
  buildPrompts,
  DEFAULT_WORDS,
  getDrawer,
  getMatch,
  getTurnKey,
  revealTurn,
  schedulePhase,
} from "./lib/scribbleMatch";
import {
  getRecentMembers,
  getScribbleHostId,
  getScribbleSettings,
  isPresent,
  requireScribbleHost,
  requireScribbleMember,
} from "./lib/scribbleRoom";

const roomArgs = { roomCode: v.string(), userToken: v.string() };

const player = v.object({ id: v.id("users"), name: v.string() });
const phase = v.union(
  v.literal("drawing"),
  v.literal("reveal"),
  v.literal("finished"),
);

export const getState = query({
  args: roomArgs,
  returns: v.object({
    roomName: v.string(),
    roomCode: v.string(),
    isHost: v.boolean(),
    hostId: v.id("users"),
    hostName: v.string(),
    ownerId: v.id("users"),
    members: v.array(
      v.object({
        id: v.id("users"),
        name: v.string(),
        emoji: v.optional(v.string()),
        isHost: v.boolean(),
        seenAt: v.number(),
      }),
    ),
    match: v.union(
      v.null(),
      v.object({
        id: v.id("scribble_matches"),
        phase,
        drawer: player,
        canvasId: v.string(),
        turnKey: v.string(),
        endsAt: v.number(),
        turn: v.number(),
        totalTurns: v.number(),
        round: v.number(),
        rounds: v.number(),
        prompt: v.union(v.string(), v.null()),
        isPlaying: v.boolean(),
        guessed: v.boolean(),
        scores: v.array(
          v.object({
            id: v.id("users"),
            name: v.string(),
            emoji: v.optional(v.string()),
            count: v.number(),
          }),
        ),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { room, isHost, user } = await requireScribbleMember(ctx, args);
    const [match, recentMembers] = await Promise.all([
      getMatch(ctx, room._id),
      getRecentMembers(ctx, room._id),
    ]);
    const hostId = getScribbleHostId(room);
    const profileIds = new Set([
      hostId,
      ...recentMembers.map((member) => member.userId),
      ...(match?.players.map((player) => player.id) ?? []),
    ]);
    const profiles = new Map(
      await Promise.all(
        Array.from(
          profileIds,
          async (id) => [id, await ctx.db.get("users", id)] as const,
        ),
      ),
    );
    const members = recentMembers.map((member) => {
      const profile = profiles.get(member.userId);
      return {
        id: member.userId,
        name: profile?.username ?? "Guest",
        emoji: profile?.emoji,
        isHost: hostId === member.userId,
        seenAt: member.scribbleSeenAt ?? 0,
      };
    });
    const drawer = match && getDrawer(match);

    return {
      roomName: room.room_name || "Scribble room",
      roomCode: room.room_code,
      isHost,
      hostId,
      hostName: profiles.get(hostId)?.username ?? "the host",
      ownerId: room.ownerId,
      members,
      match:
        match && drawer
          ? {
              id: match._id,
              phase: match.phase,
              drawer,
              canvasId: match.canvasId,
              turnKey: getTurnKey(match),
              endsAt: match.endsAt,
              turn: match.turnIndex + 1,
              totalTurns: match.prompts.length,
              round: Math.floor(match.turnIndex / match.players.length) + 1,
              rounds: match.rounds,
              prompt:
                match.phase !== "drawing" || drawer.id === user.id
                  ? match.prompts[match.turnIndex]!
                  : null,
              isPlaying: match.players.some((player) => player.id === user.id),
              guessed: match.guessed.includes(user.id),
              scores: match.players
                .map((player) => ({
                  ...player,
                  emoji: profiles.get(player.id)?.emoji,
                  count: match.scores[player.id] ?? 0,
                }))
                .sort((a, b) => b.count - a.count),
            }
          : null,
    };
  },
});

export const start = mutation({
  args: {
    ...roomArgs,
    previousMatchId: v.union(v.id("scribble_matches"), v.null()),
  },
  returns: v.id("scribble_matches"),
  handler: async (ctx, args) => {
    const { room } = await requireScribbleHost(ctx, args);
    const previous = await getMatch(ctx, room._id);
    if (previous && previous.phase !== "finished") {
      throw new ConvexError("A game is already in progress.");
    }
    if ((previous?._id ?? null) !== args.previousMatchId) {
      throw new ConvexError("The room changed. Try starting again.");
    }

    const now = Date.now();
    const memberships = (await getRecentMembers(ctx, room._id))
      .filter((member) => isPresent(member.scribbleSeenAt, now))
      .sort((a, b) => a._creationTime - b._creationTime);
    const users = await Promise.all(
      memberships.map((member) => ctx.db.get(member.userId)),
    );
    const players = users.flatMap((user) =>
      user ? [{ id: user._id, name: user.username }] : [],
    );
    if (players.length < 2) {
      throw new ConvexError("At least two guests must have the room open.");
    }

    const settings = await getScribbleSettings(ctx, room.room_code);
    const rounds = Number.isInteger(settings?.rounds)
      ? Math.min(20, Math.max(1, settings!.rounds))
      : 1;
    const timer = Number.isInteger(settings?.timer)
      ? Math.min(300, Math.max(30, settings!.timer))
      : 120;
    const customWords = settings?.list_of_words
      .map((word) => word.trim())
      .filter(Boolean);
    const words = customWords?.length ? customWords : DEFAULT_WORDS;
    const turnTimeMs = timer * 1000;
    const endsAt = now + turnTimeMs;

    if (previous) await ctx.db.delete(previous._id);
    const id = await ctx.db.insert("scribble_matches", {
      roomId: room._id,
      phase: "drawing",
      players,
      prompts: buildPrompts(words, players.length * rounds),
      rounds,
      turnIndex: 0,
      guessed: [],
      scores: {},
      turnTimeMs,
      endsAt,
      canvasId: globalThis.crypto.randomUUID(),
      strokeCount: 0,
    });
    await schedulePhase(ctx, { id, turnIndex: 0, phase: "drawing", endsAt });
    return id;
  },
});

async function finishMatch(ctx: MutationCtx, match: Doc<"scribble_matches">) {
  await ctx.db.patch(match._id, { phase: "finished", endsAt: Date.now() });
}

export const stop = mutation({
  args: { ...roomArgs, id: v.id("scribble_matches") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room } = await requireScribbleHost(ctx, args);
    const match = await ctx.db.get(args.id);
    if (match?.roomId === room._id && match.phase !== "finished") {
      await finishMatch(ctx, match);
    }
    return null;
  },
});

export const advance = internalMutation({
  args: {
    id: v.id("scribble_matches"),
    turnIndex: v.number(),
    phase: v.union(v.literal("drawing"), v.literal("reveal")),
    endsAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.id);
    if (
      !match ||
      match.turnIndex !== args.turnIndex ||
      match.phase !== args.phase ||
      match.endsAt !== args.endsAt
    )
      return null;

    const now = Date.now();
    if (now < args.endsAt) {
      await schedulePhase(ctx, args);
      return null;
    }

    if (match.phase === "drawing") {
      await revealTurn(ctx, match);
      return null;
    }

    const members = await getRecentMembers(ctx, match.roomId);
    const present = new Set(
      members
        .filter((member) => isPresent(member.scribbleSeenAt, now))
        .map((member) => member.userId),
    );
    const activePlayers = match.players.filter((player) =>
      present.has(player.id),
    );
    const nextTurn = match.prompts.findIndex(
      (_, index) =>
        index > match.turnIndex &&
        present.has(match.players[index % match.players.length]!.id),
    );
    if (activePlayers.length < 2 || nextTurn === -1) {
      await finishMatch(ctx, match);
      return null;
    }

    const endsAt = now + match.turnTimeMs;
    await ctx.db.patch(match._id, {
      phase: "drawing",
      turnIndex: nextTurn,
      endsAt,
      canvasId: globalThis.crypto.randomUUID(),
      strokeCount: 0,
      guessed: [],
    });
    await schedulePhase(ctx, {
      id: match._id,
      turnIndex: nextTurn,
      phase: "drawing",
      endsAt,
    });
    return null;
  },
});
