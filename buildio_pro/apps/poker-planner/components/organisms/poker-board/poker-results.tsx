import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { AutoHeight } from "@workspace/ui/components/animate-ui/primitives/effects/auto-height";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { PokerResultChart } from "./poker-chart-result";
import { PokerResultTable } from "./poker-table-result";

export function PokerResults({
  storyId,
}: Readonly<{
  storyId: Id<"stories"> | null;
}>) {
  const { userToken } = useUserStore();
  const params = useParams();
  const roomCode = params?.roomCode as string;

  const [showMore, setShowMore] = useState(false);

  const onClickShowMore = () => {
    setShowMore((prev) => !prev);
  };

  const result = useQuery(
    api.storyPoints.getStoryPointsStats,
    storyId && userToken
      ? { token: userToken, storyId }
      : { token: userToken, roomCode },
  );

  if (!result?.success) {
    return null;
  }

  const stats = {
    chartData: result.chartData || [],
    avgPoints: result.avgPoints || 0,
    totalVoters: result.totalVoters,
  };

  if (stats.chartData.length === 0) {
    return null;
  }

  return (
    <AutoHeight
      className="w-full"
      deps={[showMore, stats.chartData.length]}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        height: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          bounce: 0,
          restDelta: 0.01,
        },
        opacity: { duration: 0.4, ease: "easeOut" },
        y: { duration: 0.4, ease: "easeOut" },
      }}
    >
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div onClick={onClickShowMore} className="cursor-pointer">
          <PokerResultChart chartData={stats.chartData} />
        </div>
        <motion.div
          initial={false}
          animate={{
            height: showMore ? "auto" : 0,
            opacity: showMore ? 1 : 0,
          }}
          transition={{
            height: { type: "spring", stiffness: 300, damping: 30, bounce: 0 },
            opacity: { duration: 0.25, ease: "easeOut" },
          }}
          className="overflow-hidden w-full md:w-[28rem] shrink-0"
        >
          <div className="p-2 border bg-card rounded-lg w-full">
            <PokerResultTable chartData={stats.chartData} />
            <div className="my-2">
              <Stats
                avgValue={stats.avgPoints}
                totalVotes={stats.totalVoters ?? 0}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AutoHeight>
  );
}

const Stats = ({
  avgValue,
  totalVotes,
}: {
  avgValue: number;
  totalVotes: number;
}) => {
  return (
    <div className="text-primary font-semibold flex justify-center items-center w-full gap-2 text-sm">
      <div className="flex items-center gap-1 border-primary border py-1 px-2 rounded-full">
        <div>{`Average: ${avgValue}`}</div>
      </div>
      <div className="flex items-center gap-1 border-primary border py-1 px-2 rounded-full">
        <div>{`Voters: ${totalVotes}`}</div>
      </div>
    </div>
  );
};
