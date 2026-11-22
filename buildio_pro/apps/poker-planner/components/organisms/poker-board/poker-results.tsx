import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { AutoHeight } from "@workspace/ui/components/animate-ui/primitives/effects/auto-height";
import { cn } from "@workspace/ui/lib/utils";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "motion/react";
import { useParams } from "next/navigation";
import { useId, useState } from "react";

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
  const detailsId = useId();
  const prefersReducedMotion = useReducedMotion();

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
      className="@container/results w-full"
      deps={[showMore, stats.chartData.length]}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        height: prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30 },
        opacity: {
          duration: prefersReducedMotion ? 0 : 0.4,
          ease: "easeOut",
        },
        y: { duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" },
      }}
    >
      <div
        className={cn(
          "grid grid-cols-1 items-start transition-[grid-template-columns,gap] duration-300 ease-in-out motion-reduce:transition-none",
          showMore
            ? "gap-4 @3xl/results:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            : "gap-0 @3xl/results:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]",
        )}
      >
        <div
          onClick={onClickShowMore}
          className="mx-auto flex w-full min-w-0 max-w-xl cursor-pointer flex-col"
        >
          <PokerResultChart chartData={stats.chartData} />
          <button
            type="button"
            aria-expanded={showMore}
            aria-controls={detailsId}
            className="cursor-pointer self-center rounded-md px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {showMore ? "Hide vote details" : "Show vote details"}
          </button>
        </div>
        <motion.div
          id={detailsId}
          initial={false}
          inert={!showMore}
          animate={{
            height: showMore ? "auto" : 0,
            opacity: showMore ? 1 : 0,
          }}
          transition={{
            height: prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 30, bounce: 0 },
            opacity: {
              duration: prefersReducedMotion ? 0 : 0.25,
              ease: "easeOut",
            },
          }}
          className="w-full min-w-0 overflow-hidden"
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
