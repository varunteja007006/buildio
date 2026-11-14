"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  ITEM_PREVIEW_NAME,
  useFileUploadContext,
  useFileUploadItemContext,
} from "@workspace/ui/components/file-upload-context";
import { getFileIcon } from "@workspace/ui/components/file-upload-utils";
import { cn } from "@workspace/ui/lib/utils";

interface FileUploadItemPreviewProps extends React.ComponentProps<"div"> {
  render?: (file: File, fallback: () => React.ReactNode) => React.ReactNode;
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}

function FileUploadItemPreview(props: FileUploadItemPreviewProps) {
  const { render, asChild, children, className, ...previewProps } = props;

  const itemContext = useFileUploadItemContext(ITEM_PREVIEW_NAME);
  const context = useFileUploadContext(ITEM_PREVIEW_NAME);

  const getDefaultRender = React.useCallback(
    (file: File) => {
      if (itemContext.fileState?.file.type.startsWith("image/")) {
        let url = context.urlCache.get(file);
        if (!url) {
          url = URL.createObjectURL(file);
          context.urlCache.set(file, url);
        }

        return (
          <img src={url} alt={file.name} className="size-full object-cover" />
        );
      }

      return getFileIcon(file);
    },
    [itemContext.fileState?.file.type, context.urlCache],
  );

  const onPreviewRender = React.useCallback(
    (file: File) => {
      if (render) {
        return render(file, () => getDefaultRender(file));
      }

      return getDefaultRender(file);
    },
    [render, getDefaultRender],
  );

  const isChildRender = asChild && React.isValidElement(children);

  return useRender({
    enabled: Boolean(itemContext.fileState),
    render: isChildRender
      ? children
      : <div data-slot="file-upload-preview" />,
    props: {
      "aria-labelledby": itemContext.nameId,
      ...previewProps,
      className: cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-accent/50 [&>svg]:size-10",
        className,
      ),
      ...(isChildRender
        ? {}
        : {
            children: (
              <>
                {itemContext.fileState &&
                  onPreviewRender(itemContext.fileState.file)}
                {children}
              </>
            ),
          }),
    },
  });
}

export { FileUploadItemPreview };
