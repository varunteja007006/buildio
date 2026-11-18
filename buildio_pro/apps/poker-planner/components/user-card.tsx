"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/lib/store/user.store";
import { PROFILE_EMOJIS } from "@/lib/utils";

type ProfileEmoji = (typeof PROFILE_EMOJIS)[number];

export function UserCard() {
  const { userToken, user } = useUserStore();
  const setProfileEmoji = useMutation(api.user.setProfileEmoji);
  const [open, setOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<ProfileEmoji>(
    PROFILE_EMOJIS[0],
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!userToken || !user?.success) {
    return null;
  }

  const saveEmoji = async () => {
    setIsSaving(true);
    try {
      await setProfileEmoji({ token: userToken, emoji: selectedEmoji });
      setOpen(false);
      toast.success("Profile emoji updated");
    } catch {
      toast.error("Could not update your profile emoji");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Choose profile emoji"
        onClick={() => {
          setSelectedEmoji(user.emoji ?? PROFILE_EMOJIS[0]);
          setOpen(true);
        }}
        className="mr-5 flex flex-row items-center gap-2"
      >
        <Avatar className="text-primary">
          <AvatarFallback className={user.emoji ? "text-xl" : undefined}>
            {user.emoji ??
              user.username.split("").slice(0, 2).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-primary font-bold capitalize">{user.username}</p>
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose your profile emoji</DialogTitle>
          <DialogDescription>
            This emoji appears beside your name in the poker room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2">
          {PROFILE_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              variant={selectedEmoji === emoji ? "default" : "outline"}
              aria-label={`Choose ${emoji}`}
              aria-pressed={selectedEmoji === emoji}
              className="h-12 text-2xl"
              onClick={() => setSelectedEmoji(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" disabled={isSaving} onClick={saveEmoji}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
