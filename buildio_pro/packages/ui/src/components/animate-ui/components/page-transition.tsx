"use client";

import { useShouldReduceMotion } from "@animate-ui/react/utils/motion";
import { AnimateView } from "motion/react-animate-view";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  EFFECTS,
  pickEffect,
  type Effect,
  type Frame,
  type PageTransitionEffect,
} from "./page-transition-effects";
import {
  backgroundOf,
  CLIP,
  clipRadius,
  frameOf,
  markRoot,
  morphRadius,
  radii,
  SHARE,
} from "./page-transition-utils";

type PageTransitionProps = React.ComponentProps<"div"> & {
  effect?: PageTransitionEffect;
  pageKey?: React.Key;
};

function PageTransition({
  effect = "fade",
  pageKey,
  ref,
  children,
  ...props
}: PageTransitionProps) {
  const pathname = usePathname();
  const key = pageKey ?? pathname;
  const reduce = useShouldReduceMotion();
  const localRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
  const styleRef = React.useRef<HTMLStyleElement>(null);
  const pointRef = React.useRef<{ x: number; y: number } | undefined>(
    undefined,
  );
  const exitRef = React.useRef<Frame | undefined>(undefined);
  const effectRef = React.useRef<Effect>("fade");
  const id = React.useId();
  const className = `page-transition-${id.replace(/[^a-z0-9]/gi, "")}`;

  React.useLayoutEffect(() => {
    effectRef.current =
      effect === "random" ? pickEffect(effectRef.current) : effect;
  }, [effect, key]);

  const refreshStyle = () => {
    if (!localRef.current || !styleRef.current) return;
    styleRef.current.textContent =
      `::view-transition-image-pair(*.${className}){border-radius:${clipRadius(localRef.current)}}` +
      `::view-transition-old(*.${className}),::view-transition-new(*.${className}){background-color:${backgroundOf(localRef.current)}}`;
  };

  React.useLayoutEffect(refreshStyle);

  React.useEffect(() => {
    const onInput = (event: Event) => {
      if (!localRef.current) return;
      pointRef.current =
        event instanceof PointerEvent
          ? { x: event.clientX, y: event.clientY }
          : undefined;
      exitRef.current = frameOf(localRef.current, pointRef.current);
    };
    document.addEventListener("pointerdown", onInput, true);
    document.addEventListener("keydown", onInput, true);
    return () => {
      document.removeEventListener("pointerdown", onInput, true);
      document.removeEventListener("keydown", onInput, true);
    };
  }, []);

  const animation = (types: string[]) => {
    markRoot();
    refreshStyle();
    const named = types.find((type): type is Effect => type in EFFECTS);
    const enter = frameOf(localRef.current!, pointRef.current);
    return EFFECTS[reduce ? "fade" : (named ?? effectRef.current)](
      types.includes("nav-back"),
      enter,
      exitRef.current ?? enter,
    );
  };

  return (
    <AnimateView
      key={key}
      enter={(types) => animation(types).enter}
      exit={(types) => animation(types).exit}
    >
      <div
        ref={localRef}
        data-slot="page-transition"
        {...props}
        style={{
          viewTransitionClass: `page-transition ${className}`,
          ...props.style,
        }}
      >
        <style href="page-transition" precedence="default">
          {CLIP}
        </style>
        <style ref={styleRef} />
        {children}
      </div>
    </AnimateView>
  );
}

type PageTransitionSharedProps = React.ComponentProps<"div"> & {
  name: string;
};

function PageTransitionShared({
  name,
  ref,
  ...props
}: PageTransitionSharedProps) {
  const localRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
  const fromRef = React.useRef<string | undefined>(undefined);

  React.useLayoutEffect(() => {
    if (!localRef.current) return;
    fromRef.current = radii.get(name);
    radii.set(name, getComputedStyle(localRef.current).borderRadius);
  });

  return (
    <AnimateView
      name={name}
      transition={SHARE}
      onAnimationStart={(_, type) => {
        if (type === "share" && localRef.current)
          morphRadius(
            name,
            fromRef.current,
            getComputedStyle(localRef.current).borderRadius,
          );
      }}
    >
      <div
        ref={localRef}
        data-slot="page-transition-shared"
        {...props}
        style={{
          viewTransitionClass: "page-transition-shared",
          ...props.style,
        }}
      />
    </AnimateView>
  );
}

export {
  PageTransition,
  PageTransitionShared,
  type PageTransitionProps,
  type PageTransitionSharedProps,
};

export type { PageTransitionEffect } from "./page-transition-effects";
