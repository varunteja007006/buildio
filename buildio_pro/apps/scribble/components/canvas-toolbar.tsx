"use client";

import { Button } from "@workspace/ui/components/button";
import { CircleX, Eraser, Pencil } from "lucide-react";

const COLORS = [
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Black", value: "#000000" },
  { label: "White", value: "#ffffff" },
];

const PEN_SIZES = [
  { label: "Thin pen", value: 1, dot: 4 },
  { label: "Medium pen", value: 3, dot: 8 },
  { label: "Thick pen", value: 5, dot: 12 },
];

const ERASER_SIZES = [
  { label: "Small eraser", value: 8, dot: 5 },
  { label: "Medium eraser", value: 14, dot: 9 },
  { label: "Large eraser", value: 20, dot: 13 },
];

const SELECTED_BUTTON =
  "aria-pressed:border-teal-600 aria-pressed:bg-teal-50 aria-pressed:text-teal-800 dark:aria-pressed:border-teal-400 dark:aria-pressed:bg-teal-950 dark:aria-pressed:text-teal-200";

interface CanvasToolbarProps {
  tool: "pen" | "eraser";
  color: string;
  strokeWidth: number;
  eraserWidth: number;
  onSelectTool: (tool: "pen" | "eraser") => void;
  onClear: () => void;
  onSelectColor: (color: string) => void;
  onSelectStrokeWidth: (width: number) => void;
  onSelectEraserWidth: (width: number) => void;
}

function GroupLabel({ children }: { children: string }) {
  return (
    <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

export function CanvasToolbar({
  tool,
  color,
  strokeWidth,
  eraserWidth,
  onSelectTool,
  onClear,
  onSelectColor,
  onSelectStrokeWidth,
  onSelectEraserWidth,
}: CanvasToolbarProps) {
  const sizes = tool === "pen" ? PEN_SIZES : ERASER_SIZES;
  const selectedSize = tool === "pen" ? strokeWidth : eraserWidth;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b bg-(--scribble-panel) px-2 py-2 sm:px-3">
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Drawing tool"
      >
        <GroupLabel>Tool</GroupLabel>
        <Button
          variant="outline"
          size="icon-sm"
          className={SELECTED_BUTTON}
          onClick={() => onSelectTool("pen")}
          aria-label="Pen"
          aria-pressed={tool === "pen"}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className={SELECTED_BUTTON}
          onClick={() => onSelectTool("eraser")}
          aria-label="Eraser"
          aria-pressed={tool === "eraser"}
        >
          <Eraser className="size-4" />
        </Button>
      </div>

      {tool === "pen" && (
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Pen color"
        >
          <GroupLabel>Color</GroupLabel>
          {COLORS.map((item) => (
            <Button
              key={item.value}
              variant="outline"
              size="icon-sm"
              className="size-7 sm:size-8"
              onClick={() => onSelectColor(item.value)}
              aria-label={`${item.label} color`}
              aria-pressed={color === item.value}
            >
              <span
                className={`size-4 rounded-full border border-slate-400 ${color === item.value ? "ring-2 ring-teal-600 ring-offset-1 ring-offset-(--scribble-panel) dark:ring-teal-300" : ""}`}
                style={{ backgroundColor: item.value }}
              />
            </Button>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={tool === "pen" ? "Pen size" : "Eraser size"}
      >
        <GroupLabel>Size</GroupLabel>
        {sizes.map((size) => (
          <Button
            key={size.value}
            variant="outline"
            size="icon-sm"
            className={SELECTED_BUTTON}
            onClick={() =>
              tool === "pen"
                ? onSelectStrokeWidth(size.value)
                : onSelectEraserWidth(size.value)
            }
            aria-label={size.label}
            aria-pressed={selectedSize === size.value}
          >
            <span
              className={`block rounded-full ${tool === "pen" ? "bg-current" : "border border-current"}`}
              style={{ width: size.dot, height: size.dot }}
            />
          </Button>
        ))}
      </div>

      <div className="ml-auto" role="group" aria-label="Canvas actions">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          aria-label="Clear canvas"
        >
          <CircleX className="size-4" />
          Clear canvas
        </Button>
      </div>
    </div>
  );
}
