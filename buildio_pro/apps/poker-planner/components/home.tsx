import { UserRegistration } from "@workspace/game-ui/components/user-registration";
import { cn } from "@workspace/ui/lib/utils";
import type { CSSProperties } from "react";

const FLOATING_CARDS = [
  {
    value: "8",
    className: "left-[5%] top-[16%] hidden md:flex",
    size: "h-20 w-14 text-xl",
    style: {
      "--float-rotate": "-7deg",
      animationDuration: "8s",
    } as CSSProperties,
  },
  {
    value: "3",
    className: "right-[7%] top-[12%] hidden md:flex",
    size: "h-16 w-12 text-lg",
    style: {
      "--float-rotate": "9deg",
      animationDelay: "1.2s",
      animationDuration: "6.5s",
    } as CSSProperties,
  },
  {
    value: "5",
    className: "bottom-[22%] left-[10%] hidden lg:flex",
    size: "h-16 w-12 text-lg",
    style: {
      "--float-rotate": "5deg",
      animationDelay: "2.1s",
      animationDuration: "7.5s",
    } as CSSProperties,
  },
  {
    value: "13",
    className: "bottom-[18%] right-[9%] hidden lg:flex",
    size: "h-20 w-14 text-xl",
    style: {
      "--float-rotate": "-11deg",
      animationDelay: "0.6s",
      animationDuration: "8.5s",
    } as CSSProperties,
  },
  {
    value: "1",
    className: "right-[16%] top-[42%] hidden xl:flex",
    size: "h-14 w-10 text-base",
    style: {
      "--float-rotate": "13deg",
      animationDelay: "1.7s",
      animationDuration: "6s",
    } as CSSProperties,
  },
  {
    value: "2",
    className: "left-[15%] top-[48%] hidden xl:flex",
    size: "h-14 w-10 text-base",
    style: {
      "--float-rotate": "-5deg",
      animationDelay: "2.6s",
      animationDuration: "9s",
    } as CSSProperties,
  },
];

function FloatingCard({
  value,
  className,
  size,
  style,
}: Readonly<{
  value: string;
  className?: string;
  size: string;
  style?: CSSProperties;
}>) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        "animate-float absolute z-0 items-center justify-center rounded-xl border border-primary/25 bg-card/90 font-bold text-primary/90 shadow-md shadow-primary/10 backdrop-blur-sm select-none",
        size,
        className,
      )}
    >
      {value}
    </div>
  );
}

export default function Home() {
  return (
    <div className="sm:min-h-[calc(100svh-18rem)] relative isolate flex min-h-[calc(100svh-3rem)] flex-col items-center justify-center overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="hero-aurora pointer-events-none absolute inset-0 -z-10"
      >
        {FLOATING_CARDS.map((card) => (
          <FloatingCard key={card.value} {...card} />
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-7 px-4 text-center">
        <div className="flex flex-col items-center gap-5">
          <h1
            style={{ animationDelay: "100ms" }}
            className="animate-rise bg-linear-to-r from-primary from-35% via-primary/80 via-70% to-primary/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl"
          >
            Plan together. Estimate smarter.
          </h1>
          <p
            style={{ animationDelay: "200ms" }}
            className="animate-rise max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            Bring your team together, discuss tasks, and reach estimates with
            confidence. Better collaboration starts with a single session.
          </p>
        </div>

        <div
          style={{ animationDelay: "300ms" }}
          className="animate-rise mt-1 flex flex-col items-center gap-1.5"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Ready to play?
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose your display name and join the planning table.
          </p>
        </div>

        <UserRegistration
          animated
          askRole
          delayMs={400}
          className="mx-auto w-full max-w-[calc(var(--container-sm)+2rem)] rounded-2xl border border-border/70 bg-card/80 p-6 text-left shadow-lg shadow-primary/5 backdrop-blur-md"
        />
      </div>
    </div>
  );
}
