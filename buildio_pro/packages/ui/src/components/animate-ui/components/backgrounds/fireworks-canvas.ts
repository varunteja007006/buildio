// Canvas engine for the fireworks background: sizing, the rAF loop and the
// launch/click handlers. Vendored from animate-ui and split out of
// fireworks.tsx to keep each file small.

import {
  createFirework,
  getColor,
  getValueByRange,
  rand,
  type ParticleType,
  type SpeedRange,
} from "./fireworks-engine";

export type FireworksOptions = {
  population: number;
  color: string | string[] | undefined;
  fireworkSpeed: SpeedRange;
  fireworkSize: SpeedRange;
  particleSpeed: SpeedRange;
  particleSize: SpeedRange;
};

export type FireworksEngine = {
  start: () => void;
  stop: () => void;
  still: () => void;
  launch: (x?: number, targetY?: number) => void;
  destroy: () => void;
};

export function createFireworksEngine(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  optionsRef: { readonly current: FireworksOptions },
): FireworksEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Fireworks: 2D context unavailable");

  let maxX = 0;
  let maxY = 0;
  let scale = 1;

  const explosions: ParticleType[] = [];
  const fireworks: ReturnType<typeof createFirework>[] = [];

  let running = false;
  let frameId = 0;
  let launchTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const clear = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
  };

  const render = () => {
    clear();
    for (let i = fireworks.length - 1; i >= 0; i--) fireworks[i]?.draw(ctx);
    for (let i = explosions.length - 1; i >= 0; i--) explosions[i]?.draw(ctx);
  };

  const setCanvasSize = () => {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    maxX = window.innerWidth;
    maxY = maxX * (height / width);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    scale = canvas.width / maxX;
    if (!running) render();
  };
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);
  const resizeObserver = new ResizeObserver(setCanvasSize);
  resizeObserver.observe(container);

  const handleExplosion = (particles: ParticleType[]) => {
    explosions.push(...particles);
  };

  const addFirework = (x: number, targetY: number) => {
    const options = optionsRef.current;
    fireworks.push(
      createFirework(
        x,
        maxY,
        targetY,
        getColor(options.color),
        getValueByRange(options.fireworkSpeed),
        getValueByRange(options.fireworkSize),
        options.particleSpeed,
        options.particleSize,
        handleExplosion,
      ),
    );
  };

  const launchFirework = () => {
    const { population } = optionsRef.current;
    if (population > 0) {
      addFirework(rand(maxX * 0.1, maxX * 0.9), rand(maxY * 0.1, maxY * 0.4));
      launchTimeoutId = setTimeout(launchFirework, rand(300, 800) / population);
    }
  };

  const animate = () => {
    clear();

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const firework = fireworks[i];
      if (!firework?.update()) {
        fireworks.splice(i, 1);
      } else {
        firework.draw(ctx);
      }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
      const particle = explosions[i];
      particle?.update();
      if (particle?.isAlive()) {
        particle.draw(ctx);
      } else {
        explosions.splice(i, 1);
      }
    }

    frameId = requestAnimationFrame(animate);
  };

  const start = () => {
    if (running) return;
    running = true;
    launchFirework();
    animate();
  };

  const stop = () => {
    running = false;
    clearTimeout(launchTimeoutId);
    cancelAnimationFrame(frameId);
  };

  const still = () => {
    if (running) return;
    fireworks.length = 0;
    explosions.length = 0;
    const options = optionsRef.current;
    for (let i = 0; i < 3; i++) {
      const firework = createFirework(
        maxX * (0.25 + i * 0.25),
        maxY * rand(0.25, 0.45),
        0,
        getColor(options.color),
        0,
        0,
        options.particleSpeed,
        options.particleSize,
        handleExplosion,
      );
      firework.explode();
    }
    for (let i = 0; i < 25; i++) {
      for (const particle of explosions) particle.update();
    }
    render();
  };

  const launch = (x?: number, targetY?: number) => {
    addFirework(
      x ?? rand(maxX * 0.1, maxX * 0.9),
      targetY ?? rand(maxY * 0.1, maxY * 0.4),
    );
    if (!running) render();
  };

  const handleClick = (event: MouseEvent) => {
    if (!running) return;
    const rect = container.getBoundingClientRect();
    const unit = maxX / rect.width;
    addFirework(
      (event.clientX - rect.left) * unit,
      (event.clientY - rect.top) * unit,
    );
  };
  container.addEventListener("click", handleClick);

  const destroy = () => {
    stop();
    window.removeEventListener("resize", setCanvasSize);
    resizeObserver.disconnect();
    container.removeEventListener("click", handleClick);
  };

  return { start, stop, still, launch, destroy };
}
