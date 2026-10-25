/**
 * Shared canvas drawing helpers for the waveform components.
 */

export function heightToStyle(height: string | number) {
  return typeof height === "number" ? `${height}px` : height;
}

export function getComputedBarColor(
  canvas: HTMLCanvasElement,
  barColor?: string,
) {
  return (
    barColor ||
    getComputedStyle(canvas).getPropertyValue("--foreground") ||
    "#000"
  );
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  barWidth: number,
  barHeight: number,
  barRadius: number,
) {
  if (barRadius > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, barRadius);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, barWidth, barHeight);
  }
}

export function drawFadeEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fadeWidth: number,
) {
  if (fadeWidth <= 0 || width <= 0) return;

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  const fadePercent = Math.min(0.2, fadeWidth / width);

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
  gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(255,255,255,1)");

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
}

export function observeCanvasResize(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onResize?: () => void,
) {
  const resizeObserver = new ResizeObserver(() => {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      onResize?.();
    }
  });

  resizeObserver.observe(container);
  return () => resizeObserver.disconnect();
}
