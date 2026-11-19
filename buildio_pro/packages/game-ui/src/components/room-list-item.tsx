import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Users } from "lucide-react";
import type { CSSProperties } from "react";

import { useJoinRoom } from "../hooks/use-join-room";
import { CopyBtn } from "./atoms/copy-btn";

export function RoomListItem({
  label,
  roomCode,
  isNew,
}: Readonly<{
  label: string;
  roomCode: string;
  isNew?: boolean;
}>) {
  const { joinRoom, isJoining } = useJoinRoom();

  const handleJoin = async () => {
    await joinRoom(roomCode);
  };

  return (
    <div className="bg-secondary/10 border-2 border-primary flex max-w-xl flex-col items-center justify-between gap-2 rounded p-2">
      <div className="flex flex-row items-center justify-between gap-2">
        <Users className="size-5" />
        {label}
        {isNew && (
          <Badge variant="secondary" className="text-secondary-foreground">
            New
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleJoin}
          variant={"default"}
          className="cursor-pointer"
          disabled={isJoining}
        >
          {isJoining ? "Joining..." : "Join"}
        </Button>
        <CopyBtn text={roomCode} tooltipText="Copy Room Code" />
      </div>
    </div>
  );
}

export function RoomLineItem({
  label,
  roomCode,
  isNew,
  style,
}: Readonly<{
  label: string;
  roomCode: string;
  isNew?: boolean;
  style?: CSSProperties;
}>) {
  const { joinRoom, isJoining } = useJoinRoom();

  const handleJoin = async () => {
    await joinRoom(roomCode);
  };

  return (
    <div
      style={style}
      className="flex border border-primary pl-4 p-2 rounded flex-row items-center justify-between gap-2 w-full max-w-sm animate-in fade-in duration-500 ease-out fill-mode-backwards"
    >
      <p className="font-semibold w-full">{label}</p>

      {isNew && (
        <Badge variant="secondary" className="text-secondary-foreground">
          New
        </Badge>
      )}

      <div className="flex items-center gap-2">
        <Button
          onClick={handleJoin}
          variant={"default"}
          className="cursor-pointer rounded"
          disabled={isJoining}
        >
          {isJoining ? "Joining..." : "Join"}
        </Button>
        <CopyBtn
          text={roomCode}
          className="rounded cursor-pointer"
          tooltipText="Copy Room Code"
        />
      </div>
    </div>
  );
}
