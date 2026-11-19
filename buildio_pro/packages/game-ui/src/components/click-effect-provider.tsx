"use client";

import {
  Click,
  type ClickVariant,
} from "@workspace/ui/components/animate-ui/primitives/effects/click";
import * as React from "react";

const STORAGE_KEY = "poker-planner-click-effect";
const CLICK_VARIANTS: ClickVariant[] = [
  "ripple",
  "ring",
  "crosshair",
  "burst",
  "particles",
];

const ClickEffectContext = React.createContext<{
  effect: ClickVariant;
  setEffect: (effect: ClickVariant) => void;
  /** False when no ClickEffectProvider is mounted above the consumer. */
  enabled: boolean;
}>({
  effect: "burst",
  setEffect: () => {},
  enabled: false,
});

export function ClickEffectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [effect, setEffect] = React.useState<ClickVariant>("burst");

  React.useEffect(() => {
    const savedEffect = localStorage.getItem(STORAGE_KEY);
    if (CLICK_VARIANTS.includes(savedEffect as ClickVariant)) {
      setEffect(savedEffect as ClickVariant);
    }
  }, []);

  const selectEffect = (nextEffect: ClickVariant) => {
    localStorage.setItem(STORAGE_KEY, nextEffect);
    setEffect(nextEffect);
  };

  return (
    <ClickEffectContext.Provider
      value={{ effect, setEffect: selectEffect, enabled: true }}
    >
      {effect === "ripple" ? (
        <Click variant="ripple" color="var(--primary)" />
      ) : (
        <Click variant={effect} color="var(--primary)" />
      )}
      {children}
    </ClickEffectContext.Provider>
  );
}

export function useClickEffect() {
  return React.useContext(ClickEffectContext);
}
