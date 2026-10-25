import type { HTMLAttributes } from "react";

export type AgentState =
  "connecting" | "initializing" | "listening" | "speaking" | "thinking";

export interface BarVisualizerProps extends HTMLAttributes<HTMLDivElement> {
  state?: AgentState;
  barCount?: number;
  mediaStream?: MediaStream | null;
  minHeight?: number;
  maxHeight?: number;
  demo?: boolean;
  centerAlign?: boolean;
}
