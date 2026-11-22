import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation } from "convex/react";
import { Coffee } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const POKER_CARDS = [
  {
    name: "1",
    value: 1,
  },

  {
    name: "2",
    value: 2,
  },
  {
    name: "3",
    value: 3,
  },
  {
    name: "5",
    value: 5,
  },
  {
    name: "8",
    value: 8,
  },
  {
    name: "13",
    value: 13,
  },
  {
    name: "21",
    value: 21,
  },
  {
    name: <Coffee />,
    value: 0,
  },
];

export function PokerCards({
  storyId,
}: Readonly<{
  storyId: Id<"stories"> | null;
}>) {
  const [selectedCard, setSelectedCard] = React.useState<number | null>(null);
  const [isVoting, setIsVoting] = React.useState(false);

  const { userToken } = useUserStore();
  const captureStoryPoint = useMutation(api.storyPoints.captureStoryPoint);

  const onCardClick = async (value: number) => {
    if (!userToken || !storyId || isVoting || selectedCard === value) return;

    setIsVoting(true);
    try {
      const result = await captureStoryPoint({
        storyId,
        storypoint: value,
        token: userToken,
      });
      if (result.success) {
        setSelectedCard(value);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Could not save your vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-5">
      {POKER_CARDS.map((card) => (
        <button
          key={card.value}
          className={cn(
            "bg-white shadow dark:bg-secondary text-primary font-semibold border-primary/80 flex h-[80px] w-[60px] scale-[0.9] cursor-pointer flex-col items-center justify-center rounded-lg border-2 transition-all hover:scale-[1] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
            selectedCard === card.value &&
              "bg-primary dark:bg-primary text-primary-foreground",
          )}
          onClick={() => onCardClick(card.value)}
          disabled={!userToken || !storyId || isVoting}
        >
          {card.name}
        </button>
      ))}
    </div>
  );
}
