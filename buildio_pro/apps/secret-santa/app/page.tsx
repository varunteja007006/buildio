"use client";

import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { UserRegistration } from "@/components/user-registration";
import { useUserStore } from "@/lib/store/user.store";

export default function Page() {
  const { userToken } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (userToken) {
      router.push("/rooms");
    }
  }, [userToken, router]);

  return (
    <div className="flex flex-col items-center gap-5 justify-center min-h-[calc(100vh-10rem)]">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-bold text-primary text-center text-5xl">
          Secret Santa
        </h1>
        <p className="text-muted-foreground mt-3 text-center text-sm">
          Create a room, invite your friends, run the draw and share wishlists.
        </p>
        {userToken && (
          <div className="mt-4">
            <Button asChild>
              <Link href="/rooms" className="hover:cursor-pointer">
                Go to Rooms
              </Link>
            </Button>
          </div>
        )}
      </div>
      <div>
        {!userToken && (
          <UserRegistration onSuccess={() => router.push("/rooms")} />
        )}
      </div>
    </div>
  );
}
