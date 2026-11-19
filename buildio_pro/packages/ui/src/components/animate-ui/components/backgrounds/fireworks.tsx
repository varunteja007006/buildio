"use client";

import {
  ReducedMotionConfig,
  useShouldReduceMotion,
} from "@animate-ui/react/utils/motion";
import { usePageVisible } from "@animate-ui/react/utils/use-page-visible";
import { useInView } from "motion/react";
import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";

import {
  createFireworksEngine,
  type FireworksOptions,
} from "./fireworks-canvas";

type FireworksBackgroundProps = Omit<React.ComponentProps<"div">, "color"> & {
  canvasProps?: React.ComponentProps<"canvas">;
  population?: number;
  color?: string | string[];
  fireworkSpeed?: { min: number; max: number } | number;
  fireworkSize?: { min: number; max: number } | number;
  particleSpeed?: { min: number; max: number } | number;
  particleSize?: { min: number; max: number } | number;
  /**
   * Increment to launch an extra burst programmatically (a truthy value
   * launches one burst on mount as well). Ignored under reduced motion.
   */
  trigger?: number;
};

function FireworksBackgroundContent({
  ref,
  className,
  canvasProps,
  population = 1,
  color,
  fireworkSpeed = { min: 4, max: 8 },
  fireworkSize = { min: 2, max: 5 },
  particleSpeed = { min: 2, max: 7 },
  particleSize = { min: 1, max: 5 },
  trigger,
  ...props
}: FireworksBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  const inView = useInView(containerRef);
  const pageVisible = usePageVisible();
  const reduce = useShouldReduceMotion();
  const reduceRef = React.useRef(reduce);
  reduceRef.current = reduce;
  const playing = inView && pageVisible && !reduce;
  const stillKey = reduce
    ? JSON.stringify([color, particleSpeed, particleSize])
    : null;

  const optionsRef = React.useRef<FireworksOptions>({
    population,
    color,
    fireworkSpeed,
    fireworkSize,
    particleSpeed,
    particleSize,
  });
  React.useEffect(() => {
    optionsRef.current = {
      population,
      color,
      fireworkSpeed,
      fireworkSize,
      particleSpeed,
      particleSize,
    };
  });

  const engineRef = React.useRef<ReturnType<
    typeof createFireworksEngine
  > | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const engine = createFireworksEngine(canvas, container, optionsRef);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (reduce) {
      engine.still();
      return;
    }
    if (!playing) return;
    engine.start();
    return engine.stop;
  }, [playing, reduce, stillKey]);

  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !trigger || reduceRef.current) return;
    engine.launch();
  }, [trigger]);

  return (
    <div
      ref={containerRef}
      data-slot="fireworks-background"
      className={cn("relative size-full overflow-hidden", className)}
      {...props}
    >
      <canvas
        aria-hidden="true"
        {...canvasProps}
        ref={canvasRef}
        className={cn("absolute inset-0 size-full", canvasProps?.className)}
      />
    </div>
  );
}

function FireworksBackground(props: FireworksBackgroundProps) {
  return (
    <ReducedMotionConfig>
      <FireworksBackgroundContent {...props} />
    </ReducedMotionConfig>
  );
}

export { FireworksBackground, type FireworksBackgroundProps };
