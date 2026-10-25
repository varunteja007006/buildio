import type { HTMLAttributes } from "react";

export type Frame = number[][];
export type MatrixMode = "default" | "vu";

export interface CellPosition {
  x: number;
  y: number;
}

export interface MatrixProps extends HTMLAttributes<HTMLDivElement> {
  rows: number;
  cols: number;
  pattern?: Frame;
  frames?: Frame[];
  fps?: number;
  autoplay?: boolean;
  loop?: boolean;
  size?: number;
  gap?: number;
  palette?: {
    on: string;
    off: string;
  };
  brightness?: number;
  ariaLabel?: string;
  onFrame?: (index: number) => void;
  mode?: MatrixMode;
  levels?: number[];
}

export function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function ensureFrameSize(
  frame: Frame,
  rows: number,
  cols: number,
): Frame {
  const result: Frame = [];
  for (let r = 0; r < rows; r++) {
    const source = frame[r] || [];
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(source[c] ?? 0);
    }
    result.push(row);
  }
  return result;
}

export function emptyFrame(rows: number, cols: number): Frame {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function setPixel(
  frame: Frame,
  row: number,
  col: number,
  value: number,
): void {
  const target = frame[row];
  if (
    row >= 0 &&
    row < frame.length &&
    target &&
    col >= 0 &&
    col < target.length
  ) {
    target[col] = value;
  }
}
