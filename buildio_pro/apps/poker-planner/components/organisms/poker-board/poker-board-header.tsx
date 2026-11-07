import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { useQuery } from "convex/react";
import { Copy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
      <div className="flex flex-row items-center gap-4">
        <p className="font-bold text-lg text-primary">
          {roomDetails?.room?.room_name}
        </p>
      </div>
      <div className="flex flex-row items-center gap-2 justify-end">
        <Link href={"/room"}>
          <Button variant={"destructive"} className="cursor-pointer">
            Leave Room
          </Button>
        </Link>
        <CopyBtn text={roomCode as string}>
          <Copy className="mr-2" />
          Copy Room Code
        </CopyBtn>
        <ShareBtn size="icon-sm" variant="outline" />
      </div>
    </div>
  );
}
