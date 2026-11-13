"use client";

import * as React from "react";

import {
  focusFirst,
  getDirectionAwareKey,
  ITEM_NAME,
  ITEM_SELECT,
  useActionBarContext,
  useFocusContext,
  wrapArray,
} from "@workspace/ui/components/action-bar-context";
import { Button } from "@workspace/ui/components/button";
import { useIsomorphicLayoutEffect } from "@workspace/ui/hooks/use-isomorphic-layout-effect";
import { useComposedRefs } from "@workspace/ui/lib/compose-refs";
import { cn } from "@workspace/ui/lib/utils";

type ItemElement = React.ComponentRef<typeof ActionBarItem>;
type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonEvent<K extends keyof ButtonProps> = Parameters<
  Extract<NonNullable<ButtonProps[K]>, (event: never) => void>
>[0];

interface ActionBarItemProps extends Omit<
  React.ComponentProps<typeof Button>,
  "onSelect"
> {
  onSelect?: (event: Event) => void;
}

function ActionBarItem(props: ActionBarItemProps) {
  const {
    onSelect,
    onClick: onClickProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    onMouseDown: onMouseDownProp,
    className,
    disabled,
    ref,
    ...itemProps
  } = props;

  const itemRef = React.useRef<ItemElement>(null);
  const composedRef = useComposedRefs(ref, itemRef);
  const isMouseClickRef = React.useRef(false);

  const { onOpenChange, dir, orientation, loop } =
    useActionBarContext(ITEM_NAME);
  const focusContext = useFocusContext(ITEM_NAME);

  const itemId = React.useId();
  const isTabStop = focusContext.tabStopId === itemId;

  useIsomorphicLayoutEffect(() => {
    focusContext.onItemRegister({
      id: itemId,
      ref: itemRef,
      disabled: !!disabled,
    });

    if (!disabled) {
      focusContext.onFocusableItemAdd();
    }

    return () => {
      focusContext.onItemUnregister(itemId);
      if (!disabled) {
        focusContext.onFocusableItemRemove();
      }
    };
  }, [focusContext, itemId, disabled]);

  const onClick = React.useCallback(
    (event: ButtonEvent<"onClick">) => {
      onClickProp?.(event);
      if (event.defaultPrevented) return;

      const item = itemRef.current;
      if (!item) return;

      const itemSelectEvent = new CustomEvent(ITEM_SELECT, {
        bubbles: true,
        cancelable: true,
      });

      item.addEventListener(ITEM_SELECT, (event) => onSelect?.(event), {
        once: true,
      });

      item.dispatchEvent(itemSelectEvent);

      if (!itemSelectEvent.defaultPrevented) {
        onOpenChange?.(false);
      }
    },
    [onClickProp, onOpenChange, onSelect],
  );

  const onFocus = React.useCallback(
    (event: ButtonEvent<"onFocus">) => {
      onFocusProp?.(event);
      if (event.defaultPrevented) return;

      focusContext.onItemFocus(itemId);
      isMouseClickRef.current = false;
    },
    [onFocusProp, focusContext, itemId],
  );

  const onKeyDown = React.useCallback(
    (event: ButtonEvent<"onKeyDown">) => {
      onKeyDownProp?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Tab" && event.shiftKey) {
        focusContext.onItemShiftTab();
        return;
      }

      if (event.target !== event.currentTarget) return;

      const key = getDirectionAwareKey(event.key, dir);
      let focusIntent: "first" | "last" | "prev" | "next" | undefined;

      if (orientation === "horizontal") {
        if (key === "ArrowLeft") focusIntent = "prev";
        else if (key === "ArrowRight") focusIntent = "next";
        else if (key === "Home") focusIntent = "first";
        else if (key === "End") focusIntent = "last";
      } else {
        if (key === "ArrowUp") focusIntent = "prev";
        else if (key === "ArrowDown") focusIntent = "next";
        else if (key === "Home") focusIntent = "first";
        else if (key === "End") focusIntent = "last";
      }

      if (focusIntent !== undefined) {
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
          return;
        event.preventDefault();

        const items = focusContext.getItems().filter((item) => !item.disabled);
        let candidateRefs = items.map((item) => item.ref);

        if (focusIntent === "last") {
          candidateRefs.reverse();
        } else if (focusIntent === "prev" || focusIntent === "next") {
          if (focusIntent === "prev") candidateRefs.reverse();
          const currentIndex = candidateRefs.findIndex(
            (ref) => ref.current === event.currentTarget,
          );
          candidateRefs = loop
            ? wrapArray(candidateRefs, currentIndex + 1)
            : candidateRefs.slice(currentIndex + 1);
        }

        queueMicrotask(() => focusFirst(candidateRefs));
      }
    },
    [onKeyDownProp, focusContext, dir, orientation, loop],
  );

  const onMouseDown = React.useCallback(
    (event: ButtonEvent<"onMouseDown">) => {
      onMouseDownProp?.(event);
      if (event.defaultPrevented) return;

      isMouseClickRef.current = true;

      if (disabled) {
        event.preventDefault();
      } else {
        focusContext.onItemFocus(itemId);
      }
    },
    [onMouseDownProp, focusContext, itemId, disabled],
  );

  return (
    <Button
      type="button"
      data-slot="action-bar-item"
      variant="secondary"
      size="sm"
      disabled={disabled}
      tabIndex={isTabStop ? 0 : -1}
      {...itemProps}
      className={cn(orientation === "vertical" && "w-full", className)}
      ref={composedRef}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
    />
  );
}

export { ActionBarItem };
