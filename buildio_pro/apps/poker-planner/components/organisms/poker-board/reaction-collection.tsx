import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { ConfettiSideCannonsBtn } from "@workspace/ui/components/confetti/side-cannons";
import { useMutation, useQuery } from "convex/react";
import { PartyPopper } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useUserStore } from "@/lib/store/user.store";

export const ConfettiSideCanonsNotifier = () => {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const teamReactions = useQuery(api.chat.getTeamReactions, {
    userToken,
    roomCode: roomCode as string,
  });

  const memoizedTeamReactions = useMemo(() => teamReactions, [teamReactions]);

  // Track the last processed reaction ID so we don't double-trigger on page load
  const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);

  // Local state to manually trip the confetti trigger
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    if (!memoizedTeamReactions || memoizedTeamReactions.length === 0) return;

    // Assuming reactions are sorted newest first, pick the latest one
    const latestReaction = memoizedTeamReactions[0];

    const id = latestReaction ? latestReaction._id : null;

    // Initialize on mount: lock onto the current latest ID without exploding confetti
    if (lastTriggeredId === null) {
      setLastTriggeredId(id);
      return;
    }

    // If a brand new reaction ID arrives, shoot confetti! (🎉 only — 🎆 fireworks are handled separately)
    if (id !== lastTriggeredId) {
      setLastTriggeredId(id);
      if (latestReaction?.reaction === "🎉") {
        setTriggerConfetti(true);
      }
    }
  }, [memoizedTeamReactions, lastTriggeredId]);

  useEffect(() => {
    if (triggerConfetti) {
      setTriggerConfetti(false);
    }
  }, [triggerConfetti]);

  return (
    <ConfettiSideCannonsBtn
      autoTrigger={triggerConfetti} // Listens to our distinct trigger state change
      className="hidden"
    />
  );
};

export const ConfettiSideCannons = () => {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const teamReactions = useQuery(api.chat.getTeamReactions, {
    userToken,
    roomCode: roomCode as string,
  });

  const [hasReacted, setHasReacted] = useState(false);

  const createReaction = useMutation(api.chat.createTeamReaction);

  const confettiCb = () => {
    createReaction({
      userToken,
      roomCode: roomCode as string,
      reaction: "🎉",
    });
    setHasReacted(true);
  };

  const memoizedTeamReactions = useMemo(() => teamReactions, [teamReactions]);

  // Track the last processed reaction ID so we don't double-trigger on page load
  const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);

  // Local state to manually trip the confetti trigger
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    if (!memoizedTeamReactions || memoizedTeamReactions.length === 0) return;

    // Assuming reactions are sorted newest first, pick the latest one
    const latestReaction = memoizedTeamReactions[0];

    const id = latestReaction ? latestReaction._id : null;

    // Initialize on mount: lock onto the current latest ID without exploding confetti
    if (lastTriggeredId === null) {
      setLastTriggeredId(id);
      return;
    }

    // If a brand new reaction ID arrives, shoot confetti! (🎉 only — 🎆 fireworks are handled separately)
    if (id !== lastTriggeredId) {
      setLastTriggeredId(id);
      if (latestReaction?.reaction === "🎉") {
        setTriggerConfetti(true);
      }
    }
  }, [memoizedTeamReactions, lastTriggeredId]);

  useEffect(() => {
    if (hasReacted) {
      const timer = setTimeout(() => {
        setHasReacted(false);
      }, 10000); // Reset after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [hasReacted]);

  useEffect(() => {
    if (triggerConfetti) {
      setTriggerConfetti(false);
    }
  }, [triggerConfetti]);
  return (
    <ConfettiSideCannonsBtn
      onClickCb={confettiCb}
      disabled={hasReacted}
      autoTrigger={triggerConfetti} // Listens to our distinct trigger state change
      className="w-full"
      size="sm"
    >
      <PartyPopper />
      Side canons
    </ConfettiSideCannonsBtn>
  );
};
