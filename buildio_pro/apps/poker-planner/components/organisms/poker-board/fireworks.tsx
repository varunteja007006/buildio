import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { FireworksBackground } from "@workspace/ui/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@workspace/ui/components/button";
import { useMutation, useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const FIREWORK_COLORS = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
const SHOW_DURATION_MS = 8000;
const BURSTS_PER_SHOW = 6;

const FireworksOverlay = ({ trigger }: { trigger: number }) => {
  const [active, setActive] = useState(false);

  // Internal burst counter: each change launches one more rocket
  const [burst, setBurst] = useState(0);

  // Show the overlay and fire a volley of bursts on every trigger,
  // then unmount to stop the loop
  useEffect(() => {
    if (!trigger) return;

    setActive(true);

    const launchVolley = () => setBurst((count) => count + 1);
    const bursts: ReturnType<typeof setTimeout>[] = [];

    launchVolley();
    for (let i = 1; i < BURSTS_PER_SHOW; i++) {
      bursts.push(setTimeout(launchVolley, i * 400 + Math.random() * 250));
    }

    const timer = setTimeout(() => setActive(false), SHOW_DURATION_MS);

    return () => {
      for (const timeout of bursts) clearTimeout(timeout);
      clearTimeout(timer);
    };
  }, [trigger]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <FireworksBackground
        population={0}
        trigger={burst}
        color={FIREWORK_COLORS}
      />
    </div>
  );
};

// Watches team reactions and shows fireworks when anyone reacts
export const FireworksNotifier = () => {
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

  // Local counter to trip the fireworks trigger
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!memoizedTeamReactions || memoizedTeamReactions.length === 0) return;

    // Assuming reactions are sorted newest first, pick the latest one
    const latestReaction = memoizedTeamReactions[0];

    const id = latestReaction ? latestReaction._id : null;

    // Initialize on mount: lock onto the current latest ID without exploding fireworks
    if (lastTriggeredId === null) {
      setLastTriggeredId(id);
      return;
    }

    // If a brand new reaction ID arrives, launch fireworks! (🎆 only — 🎉 side cannons are handled separately)
    if (id !== lastTriggeredId) {
      setLastTriggeredId(id);
      if (latestReaction?.reaction === "🎆") {
        setTrigger((count) => count + 1);
      }
    }
  }, [memoizedTeamReactions, lastTriggeredId]);

  return <FireworksOverlay trigger={trigger} />;
};

export const Fireworks = () => {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const teamReactions = useQuery(api.chat.getTeamReactions, {
    userToken,
    roomCode: roomCode as string,
  });

  const [hasLaunched, setHasLaunched] = useState(false);

  const createReaction = useMutation(api.chat.createTeamReaction);

  const fireworksCb = () => {
    createReaction({
      userToken,
      roomCode: roomCode as string,
      reaction: "🎆",
    });
    setHasLaunched(true);
    setTrigger((count) => count + 1);
  };

  const memoizedTeamReactions = useMemo(() => teamReactions, [teamReactions]);

  // Track the last processed reaction ID so we don't double-trigger on page load
  const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);

  // Local counter to trip the fireworks trigger
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!memoizedTeamReactions || memoizedTeamReactions.length === 0) return;

    // Assuming reactions are sorted newest first, pick the latest one
    const latestReaction = memoizedTeamReactions[0];

    const id = latestReaction ? latestReaction._id : null;

    // Initialize on mount: lock onto the current latest ID without exploding fireworks
    if (lastTriggeredId === null) {
      setLastTriggeredId(id);
      return;
    }

    // If a brand new reaction ID arrives, launch fireworks! (🎆 only — 🎉 side cannons are handled separately)
    if (id !== lastTriggeredId) {
      setLastTriggeredId(id);
      if (latestReaction?.reaction === "🎆") {
        setTrigger((count) => count + 1);
      }
    }
  }, [memoizedTeamReactions, lastTriggeredId]);

  useEffect(() => {
    if (hasLaunched) {
      const timer = setTimeout(() => {
        setHasLaunched(false);
      }, 10000); // Reset after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [hasLaunched]);

  return (
    <>
      <FireworksOverlay trigger={trigger} />
      <Button
        variant="outline"
        onClick={fireworksCb}
        disabled={hasLaunched}
        className="w-full"
        size="sm"
      >
        <Sparkles />
        Fireworks
      </Button>
    </>
  );
};
