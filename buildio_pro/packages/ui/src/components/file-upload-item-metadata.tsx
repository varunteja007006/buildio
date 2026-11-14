"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  ITEM_METADATA_NAME,
  useFileUploadContext,
  useFileUploadItemContext,
} from "@workspace/ui/components/file-upload-context";
import { formatBytes } from "@workspace/ui/components/file-upload-utils";
import { cn } from "@workspace/ui/lib/utils";

interface FileUploadItemMetadataProps extends React.ComponentProps<"div"> {
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
  size?: "default" | "sm";
}

function FileUploadItemMetadata(props: FileUploadItemMetadataProps) {
  const {
    asChild,
    size = "default",
    children,
    className,
    ...metadataProps
  } = props;

  const context = useFileUploadContext(ITEM_METADATA_NAME);
  const itemContext = useFileUploadItemContext(ITEM_METADATA_NAME);

  const isChildRender = asChild && React.isValidElement(children);

  const defaultContent = itemContext.fileState ? (
    <>
      <span
        id={itemContext.nameId}
        className={cn(
          "truncate text-sm font-medium",
          size === "sm" && "text-[13px] leading-snug font-normal",
        )}
      >
        {itemContext.fileState.file.name}
      </span>
      <span
        id={itemContext.sizeId}
        className={cn(
          "truncate text-xs text-muted-foreground",
          size === "sm" && "text-[11px] leading-snug",
        )}
      >
        {formatBytes(itemContext.fileState.file.size)}
      </span>
      {itemContext.fileState.error && (
        <span id={itemContext.messageId} className="text-xs text-destructive">
          {itemContext.fileState.error}
        </span>
      )}
    </>
  ) : null;

  return useRender({
    enabled: Boolean(itemContext.fileState),
    render: isChildRender
      ? children
      : <div data-slot="file-upload-metadata" />,
    props: {
      dir: context.dir,
      ...metadataProps,
      className: cn("flex min-w-0 flex-1 flex-col", className),
      ...(isChildRender
        ? {}
        : { children: children ?? defaultContent }),
    },
  });
}

export { FileUploadItemMetadata };
