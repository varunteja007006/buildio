"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { useJoinRoom } from "@/hooks/useJoinRoom";
import { useUserStore } from "@/lib/store/user.store";

export function JoinRoomForm() {
  const { userToken } = useUserStore();
  const { joinRoom, isJoining } = useJoinRoom();
  const createRoomMutation = useMutation(api.rooms.createRoom);
  const router = useRouter();

  const [roomCode, setRoomCode] = React.useState("");
  const [roomNotFound, setRoomNotFound] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const handleRoomCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value && value.length > 100) {
      return;
    }
    setRoomCode(value);
    setRoomNotFound(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await joinRoom(roomCode);
    setRoomNotFound(result === "not-found");
  };

  const handleCreateRoom = async () => {
    if (creating) {
      return;
    }
    if (!userToken) {
      toast.error("Please register first.");
      return;
    }

    setCreating(true);
    try {
      const result = await createRoomMutation({ roomName: roomCode, userToken });

      if (result.success) {
        toast.success(result.message);
        router.push(`/room/${result.roomCode}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to create room. Please try again.");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-2">
      <Label
        className="font-semibold text-primary"
        htmlFor="roomCode"
      >{`Room Code`}</Label>
      <Input
        id="roomCode"
        name="roomCode"
        placeholder="Enter room code"
        value={roomCode}
        onChange={handleRoomCodeChange}
        disabled={isJoining || creating}
      />
      <Button
        type="submit"
        disabled={!userToken || isJoining}
        className="w-full cursor-pointer"
      >
        {isJoining ? "Joining..." : "Join"}
      </Button>
      {roomNotFound && (
        <Button
          type="button"
          onClick={handleCreateRoom}
          disabled={!userToken || isJoining || creating}
          className="w-full cursor-pointer"
        >
          {creating ? "Creating..." : "Create"}
        </Button>
      )}
    </form>
  );
}
