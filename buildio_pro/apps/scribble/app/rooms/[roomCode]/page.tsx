"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GameRoom } from "@/components/game-room";
import { Navbar } from "@/components/navbar";
import { getGameError } from "@/lib/game-error";

export default function RoomPage() {
  const { userToken } = useUserStore();
  const { roomCode } = useParams<{ roomCode: string }>();

  return (
    <EnterRoom
      key={JSON.stringify([userToken, roomCode])}
      roomCode={roomCode}
      userToken={userToken}
    />
  );
}

function EnterRoom({
  roomCode,
  userToken,
}: {
  roomCode: string;
  userToken: string;
}) {
  const enter = useMutation(api.scribbleRooms.enter);
  const [status, setStatus] = useState<"joining" | "joined" | "failed">(
    "joining",
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void enter({ roomCode, userToken }).then(
      () => {
        if (active) setStatus("joined");
      },
      (cause) => {
        if (active) {
          setError(getGameError(cause, "Could not join the room. Try again."));
          setStatus("failed");
        }
      },
    );
    return () => {
      active = false;
    };
  }, [enter, roomCode, userToken, attempt]);

  if (status === "joined")
    return <GameRoom roomCode={roomCode} userToken={userToken} />;
  if (status === "joining")
    return (
      <p className="p-4" role="status">
        Joining room…
      </p>
    );

  return (
    <div className="space-y-4 p-4">
      <Navbar />
      <p className="text-destructive" role="alert">
        {error}
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setStatus("joining");
            setAttempt((count) => count + 1);
          }}
        >
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/rooms">Back to rooms</Link>
        </Button>
      </div>
    </div>
  );
}
