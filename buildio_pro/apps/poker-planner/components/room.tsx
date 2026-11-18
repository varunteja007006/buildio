"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { useUserStore } from "@/lib/store/user.store";

import { RoomLineItem } from "./room-list-item";
import { JoinRoomForm } from "./join-room-form";

export function Room() {
  return (
    <div className="p-2 md:p-5">
      <JoinRoomForm />

      <div className="flex flex-col gap-2 mt-10">
        <h2 className="font-semibold text-primary">Recent Rooms</h2>
        <RoomList />
      </div>
    </div>
  );
}

function RoomList() {
  const { userToken } = useUserStore();
  const joinedRooms = useQuery(
    api.rooms.listJoinedRooms,
    userToken ? { userToken } : "skip",
  );

  const createdRooms = useQuery(
    api.rooms.getUserRooms,
    userToken ? { userToken } : "skip",
  );

  if (!userToken) {
    return null;
  }

  if (!joinedRooms?.success && !createdRooms?.success) {
    return null;
  }

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {joinedRooms?.rooms.map((room) => (
        <RoomLineItem
          key={room._id}
          label={room.room_name}
          roomCode={room.room_code}
        />
      ))}
      {createdRooms?.rooms.map((room) => (
        <RoomLineItem
          key={room._id}
          label={room.room_name}
          roomCode={room.room_code}
        />
      ))}
    </div>
  );
}
