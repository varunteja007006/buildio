import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Users } from "lucide-react";

import { CopyBtn } from "@/components/atoms/copy-btn";
import { useJoinRoom } from "@/hooks/useJoinRoom";

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
    <div className="text-primary bg-accent flex max-w-xl flex-row items-center justify-between gap-2 rounded p-2">
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
