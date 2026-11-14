"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  LIST_NAME,
  useFileUploadContext,
  useStore,
} from "@workspace/ui/components/file-upload-context";
import { cn } from "@workspace/ui/lib/utils";

interface FileUploadListProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
  forceMount?: boolean;
}

function FileUploadList(props: FileUploadListProps) {
  const {
    className,
    orientation = "vertical",
    asChild,
    forceMount,
    children,
    ...listProps
  } = props;

  const context = useFileUploadContext(LIST_NAME);
  const fileCount = useStore((state) => state.files.size);
  const shouldRender = forceMount || fileCount > 0;
  const isChildRender = asChild && React.isValidElement(children);

  return useRender({
    enabled: shouldRender,
    render: isChildRender ? children : <div data-slot="file-upload-list" />,
    props: {
      role: "list",
      id: context.listId,
      "aria-orientation": orientation,
      "data-orientation": orientation,
      "data-state": shouldRender ? "active" : "inactive",
      dir: context.dir,
      ...(isChildRender ? {} : { children }),
      ...listProps,
      className: cn(
        "flex flex-col gap-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-top-2",
        orientation === "horizontal" && "flex-row overflow-x-auto p-1.5",
        className,
      ),
    },
  });
}

export { FileUploadList };
