"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/lib/store/user.store";

export function CreateRoomForm({
  onSuccess,
}: Readonly<{
  onSuccess?: () => void;
}>) {
  const { userToken } = useUserStore();
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRoomMutation = useMutation(api.rooms.createRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    if (!userToken) {
      toast.error("Please register first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRoomMutation({
        roomName: roomName,
        userToken,
      });

      if (result.success) {
        toast.success(result.message);
        setRoomName("");
        onSuccess?.();
        router.push(`/rooms/${result.roomCode}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to create room. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <Label
        className="font-semibold text-primary"
        htmlFor="roomCode"
      >{`Room Name`}</Label>
      <Input
        placeholder="Enter room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        disabled={isSubmitting || !userToken || !roomName.trim()}
        className="w-full cursor-pointer"
      >
        Create Room
      </Button>
    </form>
  );
}
