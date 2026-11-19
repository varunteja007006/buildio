"use client";


import { JoinRoomForm } from "@workspace/game-ui/components/join-room-form";
import { RoomLineItem } from "@workspace/game-ui/components/room-list-item";
import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useQuery } from "convex/react";

export function Room() {
  return (
    <div className="p-2 md:p-5">
      <JoinRoomForm />

      <div className="mt-10 flex flex-col gap-2">
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

  const joinedRoomsList = joinedRooms?.rooms ?? [];
  const createdRoomsList = createdRooms?.rooms ?? [];

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {[...joinedRoomsList, ...createdRoomsList].map((room, index) => (
        <RoomLineItem
          key={room._id}
          label={room.room_name}
          roomCode={room.room_code}
          style={{ animationDelay: `${index * 75}ms` }}
        />
      ))}
    </div>
  );
}
