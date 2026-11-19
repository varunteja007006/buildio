// Engine helpers for the fireworks background, vendored from animate-ui.
// Split out of fireworks.tsx to keep each file small.

export type ParticleType = {
  x: number;
  y: number;
  color: string;
  speed: number;
  direction: number;
  vx: number;
  vy: number;
  gravity: number;
  friction: number;
  alpha: number;
  decay: number;
  size: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  isAlive: () => boolean;
};

export type FireworkType = {
  x: number;
  y: number;
  targetY: number;
  color: string;
  speed: number;
  size: number;
  angle: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  trailLength: number;
  exploded: boolean;
  update: () => boolean;
  explode: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export type SpeedRange = { min: number; max: number } | number;

export const rand = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min) + min);

export const randColor = (): string => `hsl(${randInt(0, 360)}, 100%, 50%)`;

export function getValueByRange(range: SpeedRange): number {
  if (typeof range === "number") {
    return range;
  }
  return rand(range.min, range.max);
}

export function getColor(color: string | string[] | undefined): string {
  if (Array.isArray(color)) {
    return color[randInt(0, color.length)] ?? randColor();
  }
  return color ?? randColor();
}

export function createParticle(
  x: number,
  y: number,
  color: string,
  speed: number,
  direction: number,
  gravity: number,
  friction: number,
  size: number,
): ParticleType {
  const vx = Math.cos(direction) * speed;
  const vy = Math.sin(direction) * speed;
  const alpha = 1;
  const decay = rand(0.005, 0.02);

  return {
    x,
    y,
    color,
    speed,
    direction,
    vx,
    vy,
    gravity,
    friction,
    alpha,
    decay,
    size,
    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    },
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    },
    isAlive() {
      return this.alpha > 0;
    },
  };
}

export function createFirework(
  x: number,
  y: number,
  targetY: number,
  color: string,
  speed: number,
  size: number,
  particleSpeed: SpeedRange,
  particleSize: SpeedRange,
  onExplode: (particles: ParticleType[]) => void,
): FireworkType {
  const angle = -Math.PI / 2 + rand(-0.3, 0.3);
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const trail: { x: number; y: number }[] = [];
  const trailLength = randInt(10, 25);

  return {
    x,
    y,
    targetY,
    color,
    speed,
    size,
    angle,
    vx,
    vy,
    trail,
    trailLength,
    exploded: false,
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.02;
      if (this.vy >= 0 || this.y <= this.targetY) {
        this.explode();
        return false;
      }
      return true;
    },
    explode() {
      const numParticles = randInt(50, 150);
      const particles: ParticleType[] = [];
      for (let i = 0; i < numParticles; i++) {
        const particleAngle = rand(0, Math.PI * 2);
        const localParticleSpeed = getValueByRange(particleSpeed);
        const localParticleSize = getValueByRange(particleSize);
        particles.push(
          createParticle(
            this.x,
            this.y,
            this.color,
            localParticleSpeed,
            particleAngle,
            0.05,
            0.98,
            localParticleSize,
          ),
        );
      }
      onExplode(particles);
    },
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.beginPath();
      if (this.trail.length > 1) {
        ctx.moveTo(this.trail[0]?.x ?? this.x, this.trail[0]?.y ?? this.y);
        for (const point of this.trail) {
          ctx.lineTo(point.x, point.y);
        }
      } else {
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    },
  };
}
