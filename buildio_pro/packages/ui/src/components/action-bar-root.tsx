"use client";

import { useRender } from "@base-ui/react/use-render";
import { useDirection } from "@radix-ui/react-direction";
import * as React from "react";
import * as ReactDOM from "react-dom";

import {
  ActionBarContext,
  type ActionBarContextValue,
  type Direction,
  type DivProps,
  type Orientation,
} from "@workspace/ui/components/action-bar-context";
import { useAsRef } from "@workspace/ui/hooks/use-as-ref";
import { useComposedRefs } from "@workspace/ui/lib/compose-refs";
import { cn } from "@workspace/ui/lib/utils";

type RootElement = React.ComponentRef<typeof ActionBar>;

interface ActionBarProps extends DivProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  side?: "top" | "bottom";
  sideOffset?: number;
  portalContainer?: Element | DocumentFragment | null;
  dir?: Direction;
  orientation?: Orientation;
  loop?: boolean;
}

function ActionBar(props: ActionBarProps) {
  const {
    open = false,
    onOpenChange,
    onEscapeKeyDown,
    side = "bottom",
    alignOffset = 0,
    align = "center",
    sideOffset = 16,
    portalContainer: portalContainerProp,
    dir: dirProp,
    orientation = "horizontal",
    loop = true,
    className,
    style,
    ref,
    asChild,
    children,
    ...rootProps
  } = props;

  const [mounted, setMounted] = React.useState(false);

  const rootRef = React.useRef<RootElement>(null);
  const composedRef = useComposedRefs(ref, rootRef);

  const propsRef = useAsRef({
    onEscapeKeyDown,
    onOpenChange,
  });

  const dir = useDirection(dirProp);

  React.useLayoutEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const ownerDocument = rootRef.current?.ownerDocument ?? document;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        propsRef.current.onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) {
          propsRef.current.onOpenChange?.(false);
        }
      }
    }

    ownerDocument.addEventListener("keydown", onKeyDown);
    return () => ownerDocument.removeEventListener("keydown", onKeyDown);
  }, [open, propsRef]);

  const contextValue = React.useMemo<ActionBarContextValue>(
    () => ({
      onOpenChange,
      dir,
      orientation,
      loop,
    }),
    [onOpenChange, dir, orientation, loop],
  );

  const portalContainer =
    portalContainerProp ?? (mounted ? globalThis.document?.body : null);

  const render =
    asChild && React.isValidElement(children) ? children : undefined;

  const element = useRender({
    defaultTagName: "div",
    render,
    enabled: mounted && open && portalContainer != null,
    ref: composedRef,
    props: {
      role: "toolbar",
      "aria-orientation": orientation,
      "data-slot": "action-bar",
      "data-side": side,
      "data-align": align,
      "data-orientation": orientation,
      dir,
      ...rootProps,
      className: cn(
        "fixed z-50 rounded-lg border bg-card shadow-lg outline-none",
        "fade-in-0 zoom-in-95 animate-in duration-250 [animation-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        "data-[side=bottom]:slide-in-from-bottom-4 data-[side=top]:slide-in-from-top-4",
        "motion-reduce:animate-none motion-reduce:transition-none",
        orientation === "horizontal"
          ? "flex flex-row items-center gap-2 px-2 py-1.5"
          : "flex flex-col items-start gap-2 px-1.5 py-2",
        className,
      ),
      style: {
        [side]: `${sideOffset}px`,
        ...(align === "center" && {
          left: "50%",
          translate: "-50% 0",
        }),
        ...(align === "start" && { left: `${alignOffset}px` }),
        ...(align === "end" && { right: `${alignOffset}px` }),
        ...style,
      },
      ...(render ? {} : { children }),
    },
  });

  if (!portalContainer || !open) return null;

  return (
    <ActionBarContext.Provider value={contextValue}>
      {ReactDOM.createPortal(element, portalContainer)}
    </ActionBarContext.Provider>
  );
}

export { ActionBar, type ActionBarProps };
