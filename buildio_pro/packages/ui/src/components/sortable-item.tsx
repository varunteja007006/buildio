"use client";

import { useRender } from "@base-ui/react/use-render";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";

import {
  CONTENT_NAME,
  ITEM_NAME,
  OVERLAY_NAME,
  SortableContentContext,
  SortableItemContext,
  SortableOverlayContext,
  type SortableItemContextValue,
  useSortableContext,
} from "@workspace/ui/components/sortable-context";
import { useComposedRefs } from "@workspace/ui/lib/compose-refs";
import { cn } from "@workspace/ui/lib/utils";

interface SortableItemProps extends React.ComponentProps<"div"> {
  value: UniqueIdentifier;
  asHandle?: boolean;
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
  disabled?: boolean;
}

function SortableItem(props: SortableItemProps) {
  const {
    value,
    style,
    asHandle,
    asChild,
    disabled,
    className,
    children,
    ref,
    ...itemProps
  } = props;

  const inSortableContent = React.useContext(SortableContentContext);
  const inSortableOverlay = React.useContext(SortableOverlayContext);

  if (!inSortableContent && !inSortableOverlay) {
    throw new Error(
      `\`${ITEM_NAME}\` must be used within \`${CONTENT_NAME}\` or \`${OVERLAY_NAME}\``,
    );
  }

  if (value === "") {
    throw new Error(`\`${ITEM_NAME}\` value cannot be an empty string`);
  }

  const context = useSortableContext(ITEM_NAME);
  const id = React.useId();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value, disabled });

  const composedRef = useComposedRefs(ref, (node) => {
    if (disabled) return;
    setNodeRef(node);
    if (asHandle) setActivatorNodeRef(node);
  });

  const composedStyle = React.useMemo<React.CSSProperties>(() => {
    return {
      transform: CSS.Translate.toString(transform),
      transition,
      ...style,
    };
  }, [transform, transition, style]);

  const itemContext = React.useMemo<SortableItemContextValue>(
    () => ({
      id,
      attributes,
      listeners,
      setActivatorNodeRef,
      isDragging,
      disabled,
    }),
    [id, attributes, listeners, setActivatorNodeRef, isDragging, disabled],
  );

  const isSlot = asChild && React.isValidElement(children);

  const element = useRender({
    render: isSlot ? children : <div data-slot="sortable-item" />,
    ref: composedRef,
    props: {
      id,
      "data-disabled": disabled,
      "data-dragging": isDragging ? "" : undefined,
      "data-slot": "sortable-item",
      ...itemProps,
      ...(asHandle && !disabled ? attributes : {}),
      ...(asHandle && !disabled ? listeners : {}),
      style: composedStyle,
      className: cn(
        "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        {
          "touch-none select-none": asHandle,
          "cursor-default": context.flatCursor,
          "data-dragging:cursor-grabbing": !context.flatCursor,
          "cursor-grab": !isDragging && asHandle && !context.flatCursor,
          "opacity-50": isDragging,
          "pointer-events-none opacity-50": disabled,
        },
        className,
      ),
      ...(isSlot ? {} : { children }),
    },
  });

  return (
    <SortableItemContext.Provider value={itemContext}>
      {element}
    </SortableItemContext.Provider>
  );
}

export { SortableItem };
