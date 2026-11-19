import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useQuery } from "convex/react";
import { Copy, Menu } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { CopyBtn } from "@/components/atoms/copy-btn";
import { ShareBtn } from "@/components/atoms/share-btn";
import { useUserStore } from "@/lib/store/user.store";

export function PokerBoardHeader() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const roomDetails = useQuery(api.rooms.getRoomDetails, {
    userToken,
    roomCode: roomCode as string,
  });

  return (
    <div className="w-full flex justify-between gap-2 items-center">
      <div
        className="flex flex-row items-center gap-4 animate-in fade-in slide-in-from-right-8 duration-500 ease-out"
        style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
      >
        <p className="font-bold text-lg text-primary underline underline-offset-8">
          {roomDetails?.room?.room_name}
        </p>
      </div>
      <div
        className="hidden flex-row items-center justify-end gap-2 sm:flex animate-in fade-in slide-in-from-right-8 duration-500 ease-out"
        style={{ animationDelay: "70ms", animationFillMode: "backwards" }}
      >
        <Link href={"/room"}>
          <Button variant={"destructive"} className="cursor-pointer">
            Leave Room
          </Button>
        </Link>
        <CopyBtn text={roomCode as string} disableTooltip>
          <Copy className="mr-0 sm:mr-2" />
          <span className="hidden sm:inline-block">Copy Room Code</span>
        </CopyBtn>
        <ShareBtn size="icon-sm" variant="outline" />
      </div>
      <div
        className="sm:hidden animate-in fade-in slide-in-from-right-8 duration-500 ease-out"
        style={{ animationDelay: "70ms", animationFillMode: "backwards" }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="Room actions">
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/room">Leave Room</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  await navigator.clipboard.writeText(roomCode as string);
                  toast.success("Copied to clipboard");
                } catch (error) {
                  toast.error("Failed to copy");
                  console.error("Failed to copy: ", error);
                }
              }}
            >
              Copy Room Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Share link copied");
                } catch (error) {
                  toast.error("Failed to copy");
                  console.error("Failed to copy: ", error);
                }
              }}
            >
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
