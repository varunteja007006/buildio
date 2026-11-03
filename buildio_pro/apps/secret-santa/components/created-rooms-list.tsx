"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { useUserStore } from "@/lib/store/user.store";

import { RoomListItem } from "./room-list-item";

export function CreatedRoomsList() {
  const { userToken } = useUserStore();
  const rooms = useQuery(
    api.rooms.getUserRooms,
    userToken ? { userToken } : "skip",
  );

  if (!userToken || !rooms?.success) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-primary">
        Your Created Rooms
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.rooms.length === 0 ? (
          <div className="text-sm text-accent-foreground/70">
            No rooms created yet.
          </div>
        ) : null}

        {rooms.rooms.map((room) => (
          <RoomListItem
            key={room._id}
            label={room.room_name}
            roomCode={room.room_code}
          />
        ))}
      </div>
    </div>
  );
}
