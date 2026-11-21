"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function Room() {
  const { userToken } = useUserStore();
  const router = useRouter();
  const createRoom = useMutation(api.rooms.createRoom);
  const recentRooms = useQuery(api.scribbleRooms.recentRooms, { userToken });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomCode = String(new FormData(event.currentTarget).get("roomCode"))
      .trim()
      .toUpperCase();
    if (!/^[A-Z0-9]{6,8}$/.test(roomCode)) {
      setError("Enter the 6- to 8-character room code.");
      return;
    }
    setError("");
    router.push(`/rooms/${roomCode}`);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const roomName = String(
      new FormData(event.currentTarget).get("roomName"),
    ).trim();
    setPending(true);
    try {
      const result = await createRoom({
        userToken,
        roomName,
        game: "scribble",
      });
      if (result.success && result.roomCode) {
        router.push(`/rooms/${result.roomCode}`);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Could not create the room. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <h2 className="text-2xl font-semibold">Scribble rooms</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <form
          className="space-y-3 rounded-lg border p-4"
          onSubmit={handleCreate}
        >
          <Label htmlFor="roomName">Room name</Label>
          <Input
            id="roomName"
            name="roomName"
            maxLength={100}
            required
            placeholder="Friday game night"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create room"}
          </Button>
        </form>
        <form className="space-y-3 rounded-lg border p-4" onSubmit={handleJoin}>
          <Label htmlFor="roomCode">Room code</Label>
          <Input
            id="roomCode"
            name="roomCode"
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            required
            placeholder="AB12CD34"
          />
          <Button type="submit" variant="outline" disabled={pending}>
            Join room
          </Button>
        </form>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {recentRooms && recentRooms.length > 0 && (
        <section aria-labelledby="recent-rooms">
          <h3 className="mb-2 font-semibold" id="recent-rooms">
            Recent rooms
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {recentRooms.map((room) => (
              <li key={room.code}>
                <Link
                  href={`/rooms/${room.code}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted"
                >
                  <span className="min-w-0 wrap-break-word">
                    {room.name || "Scribble room"}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {room.code}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
