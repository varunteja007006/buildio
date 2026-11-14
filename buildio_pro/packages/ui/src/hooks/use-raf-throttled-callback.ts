import * as React from "react";

import { useCallbackRef } from "@workspace/ui/hooks/use-callback-ref";

/**
 * Returns a callback that runs at most once per animation frame, keeping the
 * latest arguments. Use for high-frequency events driven by pointer movement
 * (e.g. color picker drags) where every event would trigger a re-render.
 */
export function useRafThrottledCallback<
  T extends (...args: never[]) => unknown,
>(callback: T) {
  const handleCallback = useCallbackRef(callback);
  const frameRef = React.useRef<number | null>(null);
  const argsRef = React.useRef<Parameters<T> | null>(null);
  React.useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const throttled = React.useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const pendingArgs = argsRef.current;
        argsRef.current = null;
        if (pendingArgs) {
          handleCallback(...pendingArgs);
        }
      });
    },
    [handleCallback],
  );

  return throttled;
}
