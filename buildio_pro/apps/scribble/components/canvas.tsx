"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { KonvaEventObject } from "konva/lib/Node";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";


import { CanvasToolbar } from "./canvas-toolbar";

interface LineData {
  id: string;
  tool: string;
  points: number[];
  strokeWidth: number;
  strokeColor: string;
}

// How often the in-progress stroke is streamed to the server while drawing.
// Final points are always sent on mouseup regardless of this throttle.
const STREAM_INTERVAL_MS = 80;

// Fixed logical drawing space. Strokes are always stored in these
// coordinates regardless of screen size, so resize (and players on
// different devices) zoom the canvas instead of cropping it.
const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 600;

export function Canvas() {
  // Measure the stage area (below the toolbar) so the logical canvas can be
  // scaled to fit at any screen size. Strokes are always stored in logical
  // coordinates, so resize (and players on different devices) zoom the
  // canvas instead of cropping it.
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = stageAreaRef.current;
    if (!el) return;

    const updateDimensions = () => {
      setStageSize({
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
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

  const params = useParams();
  const roomCode = params.roomCode as string;

  // Server-side source of truth: every player's strokes, ordered by draw
  // time. Convex pushes updates reactively, so all clients stay in sync.
  const strokesFromQuery = useQuery(api.scribble.getStrokes, { roomCode });
  const saveStroke = useMutation(api.scribble.saveStroke);
  const clearCanvasMutation = useMutation(api.scribble.clearCanvas);

  const { userToken } = useUserStore();

  const [tool, setTool] = useState("pen");
  const isDrawing = useRef(false);
  // The stroke currently being drawn by this user. Rendered locally so
  // drawing feels instant; the server copy streams in the background and
  // is deduplicated against by stroke id on mouseup.
  const [currentStroke, setCurrentStroke] = useState<LineData | null>(null);
  const currentStrokeRef = useRef<LineData | null>(null);
  const lastStreamedAt = useRef(0);

  const [strokeWidth, setStrokeWidth] = useState(5);
  const [eraserWidth, setEraserWidth] = useState(12);
  const [strokeColor, setStrokeColor] = useState("#000000");

  const persistStroke = (stroke: LineData, isComplete: boolean) => {
    saveStroke({ roomCode, userToken, stroke, isComplete }).catch((err) =>
      console.error("Failed to save stroke:", err),
    );
  };

  const handleMouseDown = (e: KonvaEventObject<Event>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const widthForTool = tool === "eraser" ? eraserWidth : strokeWidth;

    const stroke: LineData = {
      id: crypto.randomUUID(),
      tool,
      strokeWidth: widthForTool,
      strokeColor,
      points: [pos.x, pos.y],
    };

    currentStrokeRef.current = stroke;
    setCurrentStroke(stroke);
    lastStreamedAt.current = Date.now();

    // Create the doc immediately so stroke order on the server matches
    // draw order across players.
    persistStroke(stroke, false);
  };

  const handleMouseMove = (e: KonvaEventObject<Event>) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    const updated: LineData = {
      ...stroke,
      points: stroke.points.concat([point.x, point.y]),
    };
    currentStrokeRef.current = updated;
    setCurrentStroke(updated);

    // Stream in-progress points at a throttled rate so viewers can watch
    // the stroke being drawn live without flooding the backend.
    const now = Date.now();
    if (now - lastStreamedAt.current >= STREAM_INTERVAL_MS) {
      lastStreamedAt.current = now;
      persistStroke(updated, false);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const stroke = currentStrokeRef.current;
    if (stroke) {
      // Always send the final points so the server copy is complete even
      // if the last throttled stream was dropped.
      persistStroke(stroke, true);
    }
    currentStrokeRef.current = null;
    setCurrentStroke(null);
  };

  const handleClear = () => {
    currentStrokeRef.current = null;
    setCurrentStroke(null);
    clearCanvasMutation({ roomCode, userToken }).catch((err) =>
      console.error("Failed to clear canvas:", err),
    );
  };

  return (
    <div className="flex flex-col h-full w-full border rounded-md overflow-hidden bg-white">
      <CanvasToolbar
        onSelectTool={(nextTool) => setTool(nextTool)}
        onClear={handleClear}
        onSelectColor={setStrokeColor}
        onSelectStrokeWidth={setStrokeWidth}
        onSelectEraserWidth={setEraserWidth}
      />

      <div
        ref={stageAreaRef}
        className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
      >
        {scale > 0 && (
          <div
            className="shrink-0"
            style={{
              width: LOGICAL_WIDTH * scale,
              height: LOGICAL_HEIGHT * scale,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <Stage
                width={LOGICAL_WIDTH}
                height={LOGICAL_HEIGHT}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              >
                <Layer>
                  {strokesFromQuery
                    ?.filter((s) => s.strokeId !== currentStroke?.id)
                    .map((line) => (
                      <Line
                        key={line.strokeId}
                        points={line.points}
                        stroke={line.strokeColor}
                        strokeWidth={line.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation={
                          line.tool === "eraser"
                            ? "destination-out"
                            : "source-over"
                        }
                      />
                    ))}
                  {currentStroke && (
                    <Line
                      points={currentStroke.points}
                      stroke={currentStroke.strokeColor}
                      strokeWidth={currentStroke.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={
                        currentStroke.tool === "eraser"
                          ? "destination-out"
                          : "source-over"
                      }
                    />
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
