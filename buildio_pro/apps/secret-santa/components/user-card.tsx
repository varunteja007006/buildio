"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";

import { useUserStore } from "@/lib/store/user.store";

export function UserCard() {
  const { userToken, user } = useUserStore();

  if (!userToken || !user?.success) {
    return null;
  }

  return (
    <div className="mr-5 flex flex-row items-center gap-2">
      <Avatar className="text-primary">
        <AvatarImage src={""} />
        <AvatarFallback>
          {user?.username?.split("").slice(0, 2).join("").toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <p className="text-primary font-bold capitalize">{user?.username}</p>
    </div>
  );
}
