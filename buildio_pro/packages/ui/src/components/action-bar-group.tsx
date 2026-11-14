"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  type DivProps,
  ENTRY_FOCUS,
  EVENT_OPTIONS,
  type FocusContextValue,
  FocusContext,
  focusFirst,
  GROUP_NAME,
  type ItemData,
  useActionBarContext,
} from "@workspace/ui/components/action-bar-context";
import { useComposedRefs } from "@workspace/ui/lib/compose-refs";
import { cn } from "@workspace/ui/lib/utils";

function ActionBarGroup(props: DivProps) {
  const {
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onMouseDown: onMouseDownProp,
    className,
    asChild,
    children,
    ref,
    ...groupProps
  } = props;

  const [tabStopId, setTabStopId] = React.useState<string | null>(null);
  const [isTabbingBackOut, setIsTabbingBackOut] = React.useState(false);
  const [focusableItemCount, setFocusableItemCount] = React.useState(0);

  const groupRef = React.useRef<HTMLDivElement>(null);
  const composedRef = useComposedRefs(ref, groupRef);
  const isClickFocusRef = React.useRef(false);
  const itemsRef = React.useRef<Map<string, ItemData>>(new Map());

  const { dir, orientation } = useActionBarContext(GROUP_NAME);

  const onItemFocus = React.useCallback((tabStopId: string) => {
    setTabStopId(tabStopId);
  }, []);

  const onItemShiftTab = React.useCallback(() => {
    setIsTabbingBackOut(true);
  }, []);

  const onFocusableItemAdd = React.useCallback(() => {
    setFocusableItemCount((prevCount) => prevCount + 1);
  }, []);

  const onFocusableItemRemove = React.useCallback(() => {
    setFocusableItemCount((prevCount) => prevCount - 1);
  }, []);

  const onItemRegister = React.useCallback((item: ItemData) => {
    itemsRef.current.set(item.id, item);
  }, []);

  const onItemUnregister = React.useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

  const getItems = React.useCallback(() => {
    return Array.from(itemsRef.current.values())
      .filter((item) => item.ref.current)
      .sort((a, b) => {
        const elementA = a.ref.current;
        const elementB = b.ref.current;
        if (!elementA || !elementB) return 0;
        const position = elementA.compareDocumentPosition(elementB);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        }
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }
        return 0;
      });
  }, []);

  const onBlur = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      onBlurProp?.(event);
      if (event.defaultPrevented) return;

      setIsTabbingBackOut(false);
    },
    [onBlurProp],
  );

  const onFocus = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      onFocusProp?.(event);
      if (event.defaultPrevented) return;

      const isKeyboardFocus = !isClickFocusRef.current;
      if (
        event.target === event.currentTarget &&
        isKeyboardFocus &&
        !isTabbingBackOut
      ) {
        const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
        event.currentTarget.dispatchEvent(entryFocusEvent);

        if (!entryFocusEvent.defaultPrevented) {
          const items = Array.from(itemsRef.current.values()).filter(
            (item) => !item.disabled,
          );
          const currentItem = items.find((item) => item.id === tabStopId);

          const candidateItems = [currentItem, ...items].filter(
            Boolean,
          ) as ItemData[];
          const candidateRefs = candidateItems.map((item) => item.ref);
          focusFirst(candidateRefs, false);
        }
      }
      isClickFocusRef.current = false;
    },
    [onFocusProp, isTabbingBackOut, tabStopId],
  );

  const onMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseDownProp?.(event);
      if (event.defaultPrevented) return;

      isClickFocusRef.current = true;
    },
    [onMouseDownProp],
  );

  const focusContextValue = React.useMemo<FocusContextValue>(
    () => ({
      tabStopId,
      onItemFocus,
      onItemShiftTab,
      onFocusableItemAdd,
      onFocusableItemRemove,
      onItemRegister,
      onItemUnregister,
      getItems,
    }),
    [
      tabStopId,
      onItemFocus,
      onItemShiftTab,
      onFocusableItemAdd,
      onFocusableItemRemove,
      onItemRegister,
      onItemUnregister,
      getItems,
    ],
  );

  const render =
    asChild && React.isValidElement(children) ? children : undefined;

  return (
    <FocusContext.Provider value={focusContextValue}>
      {useRender({
        defaultTagName: "div",
        render,
        ref: composedRef,
        props: {
          role: "group",
          "data-slot": "action-bar-group",
          "data-orientation": orientation,
          dir,
          tabIndex: isTabbingBackOut || focusableItemCount === 0 ? -1 : 0,
          ...groupProps,
          className: cn(
            "flex gap-2 outline-none",
            orientation === "horizontal"
              ? "items-center"
              : "w-full flex-col items-start",
            className,
          ),
          onBlur,
          onFocus,
          onMouseDown,
          ...(render ? {} : { children }),
        },
      })}
    </FocusContext.Provider>
  );
}

export { ActionBarGroup };
