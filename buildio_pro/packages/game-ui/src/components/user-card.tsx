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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PROFILE_EMOJIS } from "../lib/emoji";
import { useUserStore } from "../lib/store/user.store";
import { ROLES, ROLE_LABELS } from "../lib/validators";
import { useClickEffect } from "./click-effect-provider";
import { RenameUserDialog } from "./rename-user-dialog";

type ProfileEmoji = (typeof PROFILE_EMOJIS)[number];
const CLICK_EFFECTS = [
  "ripple",
  "ring",
  "crosshair",
  "burst",
  "particles",
] as const;

export function UserCard({
  roomNoun = "room",
  showRole = false,
}: Readonly<{
  /** Where the profile emoji shows up, e.g. "poker room". */
  roomNoun?: string;
  /** Show the shared occupational role picker. */
  showRole?: boolean;
}>) {
  const { userToken, user } = useUserStore();
  const { effect, setEffect, enabled: clickEffectAvailable } = useClickEffect();
  const setProfileEmoji = useMutation(api.user.setProfileEmoji);
  const setUserRole = useMutation(api.user.setUserRole);
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={menuTriggerRef}
          className="mr-5 flex min-w-0 cursor-pointer flex-row items-center gap-2 rounded-full border border-border px-2.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:bg-accent"
          aria-label="User menu"
        >
          <Avatar className="text-primary">
            <AvatarFallback className={user.emoji ? "text-xl" : undefined}>
              {user.emoji ??
                user.username.split("").slice(0, 2).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-primary max-w-24 truncate font-bold animate-in fade-in duration-1000 ease-out sm:max-w-40">
            {user.username}
          </p>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {clickEffectAvailable && (
            <>
              <DropdownMenuLabel>Click effect</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={effect}
                onValueChange={(value) =>
                  setEffect(value as (typeof CLICK_EFFECTS)[number])
                }
              >
                {CLICK_EFFECTS.map((name) => (
                  <DropdownMenuRadioItem key={name} value={name}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            Change display name
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedEmoji(user.emoji ?? PROFILE_EMOJIS[0]);
              setOpen(true);
            }}
          >
            Choose profile emoji
          </DropdownMenuItem>
          {showRole && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Role</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={user.role ?? ""}
                onValueChange={(value) => {
                  const role =
                    value === ""
                      ? undefined
                      : (value as (typeof ROLES)[number]);
                  setUserRole({
                    token: userToken,
                    ...(role ? { role } : {}),
                  }).catch(() => toast.error("Could not update your role"));
                }}
              >
                {ROLES.map((role) => (
                  <DropdownMenuRadioItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuRadioItem value="">None</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameUserDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        username={user.username}
        token={userToken}
        menuTriggerRef={menuTriggerRef}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose your profile emoji</DialogTitle>
            <DialogDescription>
              This emoji appears beside your name in the {roomNoun}.
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
    </>
  );
}
