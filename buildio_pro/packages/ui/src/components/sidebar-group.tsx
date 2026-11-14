"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}) {
  const render =
    asChild && React.isValidElement(children) ? children : undefined;

  return useRender({
    defaultTagName: "div",
    render,
    props: {
      "data-slot": "sidebar-group-label",
      "data-sidebar": "group-label",
      className: cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      ),
      ...(render ? {} : { children }),
      ...props,
    },
  });
}

function SidebarGroupAction({
  className,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}) {
  const render =
    asChild && React.isValidElement(children) ? children : undefined;

  return useRender({
    defaultTagName: "button",
    render,
    props: {
      "data-slot": "sidebar-group-action",
      "data-sidebar": "group-action",
      className: cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      ),
      ...(render ? {} : { children }),
      ...props,
    },
  });
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

export {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
};
