import { emptyFrame, setPixel, type Frame } from "./matrix-types.js";

export function vu(columns: number, levels: number[]): Frame {
  const rows = 7;
  const frame = emptyFrame(rows, columns);

  for (let col = 0; col < Math.min(columns, levels.length); col++) {
    const level = Math.max(0, Math.min(1, levels[col] ?? 0));
    const height = Math.floor(level * rows);

    for (let row = 0; row < rows; row++) {
      const rowFromBottom = rows - 1 - row;
      const rowData = frame[row];
      if (rowFromBottom < height && rowData) {
        let brightness = 1;
        if (row < rows * 0.3) {
          brightness = 1;
        } else if (row < rows * 0.6) {
          brightness = 0.8;
        } else {
          brightness = 0.6;
        }
        rowData[col] = brightness;
      }
    }
  }

  return frame;
}

export const wave: Frame[] = (() => {
  const frames: Frame[] = [];
  const rows = 7;
  const cols = 7;

  for (let frame = 0; frame < 24; frame++) {
    const f = emptyFrame(rows, cols);
    const phase = (frame / 24) * Math.PI * 2;

    for (let col = 0; col < cols; col++) {
      const colPhase = (col / cols) * Math.PI * 2;
      const height = Math.sin(phase + colPhase) * 2.5 + 3.5;
      const row = Math.floor(height);

      if (row >= 0 && row < rows) {
        setPixel(f, row, col, 1);
        const frac = height - row;
        if (row > 0) setPixel(f, row - 1, col, 1 - frac);
        if (row < rows - 1) setPixel(f, row + 1, col, frac);
      }
    }

    frames.push(f);
  }

  return frames;
})();

export const snake: Frame[] = (() => {
  const frames: Frame[] = [];
  const rows = 7;
  const cols = 7;
  const path: Array<[number, number]> = [];

  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;

  const visited = new Set<string>();
  while (path.length < rows * cols) {
    path.push([y, x]);
    visited.add(`${y},${x}`);

    const nextX = x + dx;
    const nextY = y + dy;

    if (
      nextX >= 0 &&
      nextX < cols &&
      nextY >= 0 &&
      nextY < rows &&
      !visited.has(`${nextY},${nextX}`)
    ) {
      x = nextX;
      y = nextY;
    } else {
      const newDx = -dy;
      const newDy = dx;
      dx = newDx;
      dy = newDy;

      const nextX = x + dx;
      const nextY = y + dy;

      if (
        nextX >= 0 &&
        nextX < cols &&
        nextY >= 0 &&
        nextY < rows &&
        !visited.has(`${nextY},${nextX}`)
      ) {
        x = nextX;
        y = nextY;
      } else {
        break;
      }
    }
  }

  const snakeLength = 5;
  for (let frame = 0; frame < path.length; frame++) {
    const f = emptyFrame(rows, cols);

    for (let i = 0; i < snakeLength; i++) {
      const idx = frame - i;
      const cell = idx >= 0 && idx < path.length ? path[idx] : undefined;
      if (cell) {
        const [cellY, cellX] = cell;
        const brightness = 1 - i / snakeLength;
        setPixel(f, cellY, cellX, brightness);
      }
    }

    frames.push(f);
  }

  return frames;
})();
