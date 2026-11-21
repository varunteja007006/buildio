import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getUserFromToken } from "./utils";

export const checkRoomExists = query({
  args: {
    roomCode: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();

    if (room) {
      return {
        success: true,
        message: "Room exists",
      };
    } else {
      return {
        success: false,
        message: "Room not found",
      };
    }
  },
});

export const createRoom = mutation({
  args: {
    roomName: v.string(),
    userToken: v.string(),
    game: v.optional(v.literal("scribble")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    roomId: v.optional(v.id("rooms")),
    roomCode: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
  }),
  handler: async (ctx, args) => {
    // Get user by token
    const userResult = await getUserFromToken(ctx, args.userToken);

    if (!userResult.success) {
      return {
        success: false,
        message: userResult.message || "User not found",
      };
    }

    const ownerId = userResult.id;
    if (!ownerId) {
      return {
        success: false,
        message: "User ID not found",
      };
    }

    const roomName = args.roomName.trim();
    if (args.game === "scribble" && (!roomName || roomName.length > 100)) {
      return {
        success: false,
        message: "Enter a room name up to 100 characters.",
      };
    }

    // Generate unique room code
    function generateCode() {
      if (!args.game) {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      }
      return globalThis.crypto
        .randomUUID()
        .replaceAll("-", "")
        .slice(0, 8)
        .toUpperCase();
    }

    let roomCode: string;
    let existing;
    do {
      roomCode = generateCode();
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_room_code", (q) => q.eq("room_code", roomCode))
        .unique();
    } while (existing);

    // Create room
    const now = Date.now();
    const roomId = await ctx.db.insert("rooms", {
      room_name: args.game ? roomName : args.roomName,
      room_code: roomCode,
      created_at: now,
      ownerId,
      ...(args.game ? { game: args.game } : {}),
    });

    // Create team record for owner
    const teamId = await ctx.db.insert("teams", {
      roomId,
      userId: ownerId,
      created_at: now,
    });

    return {
      success: true,
      message: "Room created successfully",
      roomId,
      roomCode,
      teamId,
    };
  },
});

export const getUserRooms = query({
  args: {
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    rooms: v.array(
      v.object({
        _id: v.id("rooms"),
        room_name: v.string(),
        room_code: v.string(),
        created_at: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get user by token
    const userResult = await getUserFromToken(ctx, args.userToken);

    if (!userResult.success || !userResult.id) {
      return { success: false, message: "User not found", rooms: [] };
    }

    const rooms: Doc<"rooms">[] = await ctx.db
      .query("rooms")
      .withIndex("by_owner", (q) => q.eq("ownerId", userResult.id))
      .collect();

    return {
      success: true,
      message: "Rooms found",
      rooms: rooms.map((item) => ({
        _id: item._id,
        room_name: item.room_name,
        room_code: item.room_code,
        created_at: item.created_at,
      })),
    };
  },
});

export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    teamId: v.optional(v.id("teams")),
  }),
  handler: async (ctx, args) => {
    // Get user by token
    const userResult = await getUserFromToken(ctx, args.userToken);

    if (!userResult.success || !userResult.id) {
      return {
        success: false,
        message: userResult.message || "User not found",
      };
    }

    const userId = userResult.id;

    // Get room by code
    const room: Doc<"rooms"> | null = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();

    if (!room || room.game === "scribble") {
      return {
        success: false,
        message: "Room not found",
      };
    }

    const roomId = room._id;

    // Check if already a member
    const teams: Doc<"teams">[] = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();

    const existingTeam = teams.find((t) => t.userId === userId);

    if (existingTeam) {
      return {
        success: true,
        message: "Already a member of the room",
        teamId: existingTeam._id,
      };
    }

    // Create team record
    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      roomId,
      userId,
      created_at: now,
    });

    return {
      success: true,
      message: "Successfully joined the room",
      teamId,
    };
  },
});

export const listJoinedRooms = query({
  args: {
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    rooms: v.array(
      v.object({
        _id: v.id("rooms"),
        room_name: v.string(),
        room_code: v.string(),
        created_at: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get user by token
    const userResult = await getUserFromToken(ctx, args.userToken);

    if (!userResult.success || !userResult.id) {
      return {
        success: false,
        message: userResult.message || "User not found",
        rooms: [],
      };
    }

    const userId = userResult.id;

    // Get all teams for the user
    const teams: Doc<"teams">[] = await ctx.db
      .query("teams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const joinedRooms: {
      _id: Id<"rooms">;
      room_name: string;
      room_code: string;
      created_at: number;
    }[] = [];

    for (const team of teams) {
      const room = await ctx.db.get(team.roomId);
      if (room && room.ownerId !== userId) {
        joinedRooms.push({
          _id: room._id,
          room_name: room.room_name,
          room_code: room.room_code,
          created_at: room.created_at,
        });
      }
    }

    return {
      success: true,
      message: "Joined rooms retrieved successfully",
      rooms: joinedRooms,
    };
  },
});

export const getRoomDetails = query({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    room: v.optional(
      v.object({
        _id: v.id("rooms"),
        room_name: v.string(),
        room_code: v.string(),
        created_at: v.number(),
        ownerId: v.id("users"),
      }),
    ),
    owner: v.optional(
      v.object({
        id: v.id("users"),
        username: v.string(),
        created_at: v.number(),
        last_active: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get calling user by token
    const userResult = await getUserFromToken(ctx, args.userToken);

    if (!userResult.success || !userResult.id) {
      return {
        success: false,
        message: userResult.message || "User not found",
        room: undefined,
        owner: undefined,
      };
    }

    const userId = userResult.id;

    // Get room by code
    const room: Doc<"rooms"> | null = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();

    if (!room) {
      return {
        success: false,
        message: "Room not found",
        room: undefined,
        owner: undefined,
      };
    }

    const roomId = room._id;

    // Check if calling user is in the room
    const userTeams: Doc<"teams">[] = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();

    const isInRoom = userTeams.some((team) => team.userId === userId);
    if (!isInRoom) {
      return {
        success: false,
        message: "User not authorized to view room details",
        room: undefined,
        owner: undefined,
      };
    }

    // Get owner details
    const owner: Doc<"users"> | null = await ctx.db.get(room.ownerId);
    if (!owner) {
      return {
        success: true,
        message: "Room details retrieved successfully, without owner info",
        room: {
          _id: room._id,
          room_name: room.room_name,
          room_code: room.room_code,
          created_at: room.created_at,
          ownerId: room.ownerId,
        },
        owner: undefined,
      };
    }

    return {
      success: true,
      message: "Room details retrieved successfully",
      room: {
        _id: room._id,
        room_name: room.room_name,
        room_code: room.room_code,
        created_at: room.created_at,
        ownerId: room.ownerId,
      },
      owner: {
        id: owner._id,
        username: owner.username,
        created_at: owner.created_at,
        last_active: owner.last_active,
      },
    };
  },
});
