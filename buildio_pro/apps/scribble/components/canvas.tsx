"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { KonvaEventObject } from "konva/lib/Node";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import { toast } from "sonner";

import { getGameError } from "@/lib/game-error";

import { CanvasToolbar } from "./canvas-toolbar";

interface LineData {
  id: string;
  tool: "pen" | "eraser";
  points: number[];
  strokeWidth: number;
  strokeColor: string;
}

// How often the in-progress stroke is streamed to the server while drawing.
// Final points are always sent on mouseup regardless of this throttle.
const STREAM_INTERVAL_MS = 140;
const MAX_COORDINATES = 512;

// Fixed logical drawing space. Strokes are always stored in these
// coordinates regardless of screen size, so resize (and players on
// different devices) zoom the canvas instead of cropping it.
const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 600;

function DrawingLine({
  line,
}: {
  line: Pick<LineData, "points" | "strokeWidth" | "strokeColor"> & {
    tool: string;
  };
}) {
  return (
    <Line
      points={line.points}
      stroke={line.strokeColor}
      strokeWidth={line.strokeWidth}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation={
        line.tool === "eraser" ? "destination-out" : "source-over"
      }
    />
  );
}

export function Canvas({
  roomCode,
  userToken,
  canvasId,
  canDraw,
}: {
  roomCode: string;
  userToken: string;
  canvasId: string;
  canDraw: boolean;
}) {
  // Measure the stage area (below the toolbar) so the logical canvas can be
  // scaled to fit at any screen size. Strokes are always stored in logical
  // coordinates, so resize (and players on different devices) zoom the
  // canvas instead of cropping it.
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = stageAreaRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect;
        setStageSize({ width, height });
      }
    });
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

  const scale =
    stageSize.width > 0 && stageSize.height > 0
      ? Math.min(
          stageSize.width / LOGICAL_WIDTH,
          stageSize.height / LOGICAL_HEIGHT,
        )
      : 0;

  const canvasArgs = { roomCode, userToken, canvasId };
  const strokesFromQuery = useQuery(api.scribble.getStrokes, canvasArgs);
  const saveStroke = useMutation(api.scribble.saveStroke).withOptimisticUpdate(
    (store, args) => {
      const list = store.getQuery(api.scribble.getStrokes, canvasArgs);
      if (!list) return;
      const { id: strokeId, ...stroke } = args.stroke;
      const line = { ...stroke, strokeId };
      const next = list.some((item) => item.strokeId === strokeId)
        ? list.map((item) => (item.strokeId === strokeId ? line : item))
        : [...list, line];
      store.setQuery(api.scribble.getStrokes, canvasArgs, next);
    },
  );
  const clearCanvasMutation = useMutation(api.scribble.clearCanvas);
  const [tool, setTool] = useState<LineData["tool"]>("pen");
  const [currentStroke, setCurrentStroke] = useState<LineData | null>(null);
  const currentStrokeRef = useRef<LineData | null>(null);
  const activePointer = useRef<number | null>(null);
  const lastStreamedAt = useRef(0);
  const lastErrorAt = useRef(0);
  const [clearing, setClearing] = useState(false);

  const [strokeWidth, setStrokeWidth] = useState(5);
  const [eraserWidth, setEraserWidth] = useState(14);
  const [strokeColor, setStrokeColor] = useState("#000000");

  function reportError(cause: unknown) {
    const now = Date.now();
    if (now - lastErrorAt.current < 3000) return;
    lastErrorAt.current = now;
    toast.error(getGameError(cause, "Could not update the canvas. Try again."));
  }

  function persistStroke(stroke: LineData, isComplete: boolean) {
    void saveStroke({ ...canvasArgs, stroke, isComplete }).catch(reportError);
  }

  function pointFromEvent(event: KonvaEventObject<PointerEvent>) {
    const point = event.target.getStage()?.getPointerPosition();
    if (!point) return null;
    return [
      Math.min(LOGICAL_WIDTH, Math.max(0, point.x)),
      Math.min(LOGICAL_HEIGHT, Math.max(0, point.y)),
    ];
  }

  function handlePointerDown(event: KonvaEventObject<PointerEvent>) {
    if (
      !canDraw ||
      clearing ||
      event.evt.button !== 0 ||
      activePointer.current !== null
    )
      return;
    const point = pointFromEvent(event);
    if (!point) return;
    activePointer.current = event.evt.pointerId;

    const stroke: LineData = {
      id: crypto.randomUUID(),
      tool,
      strokeWidth: tool === "eraser" ? eraserWidth : strokeWidth,
      strokeColor,
      points: [...point, ...point],
    };
    currentStrokeRef.current = stroke;
    setCurrentStroke(stroke);
    lastStreamedAt.current = Date.now();
    persistStroke(stroke, false);
  }

  function handlePointerMove(event: KonvaEventObject<PointerEvent>) {
    const stroke = currentStrokeRef.current;
    if (!canDraw || !stroke || activePointer.current !== event.evt.pointerId)
      return;
    const point = pointFromEvent(event);
    if (!point) return;

    const split = stroke.points.length >= MAX_COORDINATES;
    if (split) persistStroke(stroke, true);
    const updated: LineData = {
      ...stroke,
      id: split ? crypto.randomUUID() : stroke.id,
      points: [...(split ? stroke.points.slice(-2) : stroke.points), ...point],
    };
    currentStrokeRef.current = updated;
    setCurrentStroke(updated);

    const now = Date.now();
    if (split || now - lastStreamedAt.current >= STREAM_INTERVAL_MS) {
      lastStreamedAt.current = now;
      persistStroke(updated, false);
    }
  }

  function handlePointerEnd(event: KonvaEventObject<PointerEvent>) {
    if (activePointer.current !== event.evt.pointerId) return;
    const stroke = currentStrokeRef.current;
    activePointer.current = null;
    if (stroke && canDraw) persistStroke(stroke, true);
    currentStrokeRef.current = null;
    setCurrentStroke(null);
  }

  async function handleClear() {
    if (!canDraw || clearing) return;
    activePointer.current = null;
    currentStrokeRef.current = null;
    setCurrentStroke(null);
    setClearing(true);
    try {
      await clearCanvasMutation(canvasArgs);
    } catch (cause) {
      reportError(cause);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex w-full flex-col overflow-hidden lg:h-full">
      {canDraw && (
        <CanvasToolbar
          tool={tool}
          color={strokeColor}
          strokeWidth={strokeWidth}
          eraserWidth={eraserWidth}
          onSelectTool={(nextTool) => setTool(nextTool)}
          onClear={handleClear}
          onSelectColor={setStrokeColor}
          onSelectStrokeWidth={setStrokeWidth}
          onSelectEraserWidth={setEraserWidth}
        />
      )}

      <div
        ref={stageAreaRef}
        className="flex aspect-4/3 max-h-[48svh] min-h-0 items-center justify-center overflow-hidden bg-(--scribble-matte) p-1.5 lg:aspect-auto lg:max-h-none lg:flex-1 lg:bg-(--scribble-panel)"
        role="region"
        aria-label="Drawing canvas"
        data-click-effect-ignore
      >
        {scale > 0 && (
          <div
            className="shrink-0 bg-white shadow-md ring-1 ring-black/10"
            style={{
              width: LOGICAL_WIDTH * scale,
              height: LOGICAL_HEIGHT * scale,
            }}
          >
            <div
              style={{
                width: LOGICAL_WIDTH,
                height: LOGICAL_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <Stage
                width={LOGICAL_WIDTH}
                height={LOGICAL_HEIGHT}
                style={{
                  touchAction: canDraw ? "none" : "auto",
                  cursor: canDraw ? "crosshair" : "default",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
              >
                <Layer listening={false}>
                  {strokesFromQuery
                    ?.filter((s) => s.strokeId !== currentStroke?.id)
                    .map((line) => (
                      <DrawingLine key={line.strokeId} line={line} />
                    ))}
                  {canDraw && currentStroke && (
                    <DrawingLine line={currentStroke} />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
