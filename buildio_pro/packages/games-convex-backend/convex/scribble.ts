import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  getMatch,
  normalizeGuess,
  requireDrawingTurn,
} from "./lib/scribbleMatch";
import {
  getScribbleSettings,
  requireScribbleHost,
  requireScribbleMember,
} from "./lib/scribbleRoom";

const MAX_STROKES = 250;
const MAX_COORDINATES = 512;
const roomArgs = { roomCode: v.string(), userToken: v.string() };

const strokeValidator = v.object({
  id: v.string(),
  tool: v.union(v.literal("pen"), v.literal("eraser")),
  points: v.array(v.number()),
  strokeWidth: v.number(),
  strokeColor: v.string(),
});

export const getStrokes = query({
  args: { ...roomArgs, canvasId: v.string() },
  returns: v.array(
    v.object({
      strokeId: v.string(),
      tool: v.string(),
      points: v.array(v.number()),
      strokeWidth: v.number(),
      strokeColor: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const { room } = await requireScribbleMember(ctx, args);
    const match = await getMatch(ctx, room._id);
    if (match?.canvasId !== args.canvasId) return [];
    const strokes = await ctx.db
      .query("scribble_lines")
      .withIndex("by_room_and_canvas", (q) =>
        q.eq("roomId", room._id).eq("canvasId", args.canvasId),
      )
      .take(MAX_STROKES);
    return strokes.map(
      ({ strokeId, tool, points, strokeWidth, strokeColor }) => ({
        strokeId,
        tool,
        points,
        strokeWidth,
        strokeColor,
      }),
    );
  },
});

export const saveStroke = mutation({
  args: {
    ...roomArgs,
    canvasId: v.string(),
    stroke: strokeValidator,
    isComplete: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { stroke } = args;
    if (
      !/^[a-f0-9-]{36}$/i.test(stroke.id) ||
      !/^#[a-f0-9]{6}$/i.test(stroke.strokeColor) ||
      !Number.isFinite(stroke.strokeWidth) ||
      stroke.strokeWidth < 1 ||
      stroke.strokeWidth > 30 ||
      stroke.points.length < 2 ||
      stroke.points.length % 2 !== 0 ||
      stroke.points.length > MAX_COORDINATES ||
      stroke.points.some(
        (point, index) =>
          !Number.isFinite(point) ||
          point < 0 ||
          point > (index % 2 === 0 ? 800 : 600),
      )
    ) {
      throw new ConvexError("Invalid drawing stroke.");
    }

    const { room, user } = await requireScribbleMember(ctx, args);
    const match = await requireDrawingTurn(
      ctx,
      room._id,
      user.id,
      args.canvasId,
    );
    const existing = await ctx.db
      .query("scribble_lines")
      .withIndex("by_room_and_canvas_and_stroke", (q) =>
        q
          .eq("roomId", room._id)
          .eq("canvasId", args.canvasId)
          .eq("strokeId", stroke.id),
      )
      .unique();
    const now = Date.now();

    if (existing) {
      if (
        !existing.isComplete &&
        stroke.points.length >= existing.points.length
      ) {
        await ctx.db.patch(existing._id, {
          points: stroke.points,
          isComplete: args.isComplete,
          updated_at: now,
        });
      }
      return null;
    }
    if (match.strokeCount >= MAX_STROKES) {
      throw new ConvexError("Canvas is full. Clear it to keep drawing.");
    }

    const { id: strokeId, ...data } = stroke;
    await ctx.db.insert("scribble_lines", {
      ...data,
      strokeId,
      roomId: room._id,
      playerId: user.id,
      canvasId: args.canvasId,
      isComplete: args.isComplete,
      created_at: now,
      updated_at: now,
    });
    await ctx.db.patch(match._id, { strokeCount: match.strokeCount + 1 });
    return null;
  },
});

export const clearCanvas = mutation({
  args: { ...roomArgs, canvasId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room, user } = await requireScribbleMember(ctx, args);
    const match = await requireDrawingTurn(
      ctx,
      room._id,
      user.id,
      args.canvasId,
    );
    await ctx.db.patch(match._id, {
      canvasId: globalThis.crypto.randomUUID(),
      strokeCount: 0,
    });
    return null;
  },
});

export const getGameSettings = query({
  args: roomArgs,
  returns: v.union(
    v.null(),
    v.object({
      rounds: v.number(),
      timer: v.number(),
      list_of_words: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const { room, isHost } = await requireScribbleMember(ctx, args);
    if (!isHost) return null;
    const settings = await getScribbleSettings(ctx, room.room_code);
    return settings
      ? {
          rounds: Math.min(20, Math.max(1, Math.trunc(settings.rounds) || 1)),
          timer: Math.min(300, Math.max(30, Math.trunc(settings.timer) || 120)),
          list_of_words: settings.list_of_words,
        }
      : null;
  },
});

export const updateGameSettings = mutation({
  args: {
    ...roomArgs,
    rounds: v.number(),
    timer: v.number(),
    list_of_words: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room } = await requireScribbleHost(ctx, args);
    const match = await getMatch(ctx, room._id);
    if (match && match.phase !== "finished") {
      throw new ConvexError("Settings can be changed between games.");
    }
    if (!Number.isInteger(args.rounds) || args.rounds < 1 || args.rounds > 20) {
      throw new ConvexError("Rounds must be a whole number from 1 to 20.");
    }
    if (!Number.isInteger(args.timer) || args.timer < 30 || args.timer > 300) {
      throw new ConvexError(
        "Turn length must be a whole number from 30 to 300 seconds.",
      );
    }
    if (args.list_of_words.length > 100) {
      throw new ConvexError("Enter up to 100 drawing prompts.");
    }
    const words = new Map<string, string>();
    for (const entry of args.list_of_words) {
      const word = entry.trim();
      const key = normalizeGuess(word);
      if (!key || word.length > 64) {
        throw new ConvexError("Each drawing prompt must be 1–64 characters.");
      }
      if (!words.has(key)) words.set(key, word);
    }

    const fields = {
      rounds: args.rounds,
      timer: args.timer,
      list_of_words: [...words.values()],
    };
    const settings = await getScribbleSettings(ctx, room.room_code);
    if (settings) {
      await ctx.db.patch(settings._id, fields);
    } else {
      await ctx.db.insert("scribble_games", {
        room_code: room.room_code,
        ...fields,
        score: {},
        created_at: Date.now(),
      });
    }
    return null;
  },
});
