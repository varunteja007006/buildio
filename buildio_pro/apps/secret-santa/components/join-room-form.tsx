"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import React from "react";

import { useJoinRoom } from "@/hooks/useJoinRoom";
import { useUserStore } from "@/lib/store/user.store";

export function JoinRoomForm() {
  const { userToken } = useUserStore();
  const { joinRoom, isJoining } = useJoinRoom();

  const [roomCode, setRoomCode] = React.useState("");

  const handleRoomCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value && value.length > 100) {
      return;
    }
    setRoomCode(event.target.value);
  };

  const handleSubmit = async () => {
    await joinRoom(roomCode);
  };

  return (
    <div className="space-y-4 w-full max-w-md">
      <Label
        className="font-semibold text-primary"
        htmlFor="roomCode"
      >{`Join Room`}</Label>
      <Input
        name="roomCode"
        placeholder="Room code"
        value={roomCode}
        onChange={handleRoomCodeChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSubmit();
          }
        }}
        disabled={isJoining}
      />
      <Button
        onClick={handleSubmit}
        disabled={!userToken || isJoining}
        className="cursor-pointer w-full"
      >
        {isJoining ? "Joining..." : "Join"}
      </Button>
    </div>
  );
}
