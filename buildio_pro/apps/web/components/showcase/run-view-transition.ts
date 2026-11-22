import { flushSync } from "react-dom";

export function runViewTransition(update: () => void) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion || !document.startViewTransition) {
    update();
    return;
  }

  document.startViewTransition(() => flushSync(update));
}
