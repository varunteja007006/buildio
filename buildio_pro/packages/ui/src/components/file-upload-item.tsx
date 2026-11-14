"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  FileUploadItemContext,
  ITEM_NAME,
  useFileUploadContext,
  useStore,
} from "@workspace/ui/components/file-upload-context";
import { cn } from "@workspace/ui/lib/utils";

interface FileUploadItemProps extends React.ComponentProps<"div"> {
  value: File;
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}

function FileUploadItem(props: FileUploadItemProps) {
  const { value, asChild, children, className, ...itemProps } = props;

  const id = React.useId();
  const statusId = `${id}-status`;
  const nameId = `${id}-name`;
  const sizeId = `${id}-size`;
  const messageId = `${id}-message`;

  const context = useFileUploadContext(ITEM_NAME);
  const fileState = useStore((state) => state.files.get(value));
  const fileCount = useStore((state) => state.files.size);
  const fileIndex = useStore((state) => {
    const files = Array.from(state.files.keys());
    return files.indexOf(value) + 1;
  });

  const itemContext = React.useMemo(
    () => ({
      id,
      fileState,
      nameId,
      sizeId,
      statusId,
      messageId,
    }),
    [id, fileState, statusId, nameId, sizeId, messageId],
  );

  const statusText = fileState
    ? fileState.error
      ? `Error: ${fileState.error}`
      : fileState.status === "uploading"
        ? `Uploading: ${fileState.progress}% complete`
        : fileState.status === "success"
          ? "Upload complete"
          : "Ready to upload"
    : null;

  const isChildRender = asChild && React.isValidElement(children);

  const element = useRender({
    enabled: Boolean(fileState),
    render: isChildRender ? children : <div data-slot="file-upload-item" />,
    props: {
      role: "listitem",
      id,
      "aria-setsize": fileCount,
      "aria-posinset": fileIndex,
      "aria-describedby": `${nameId} ${sizeId} ${statusId} ${
        fileState?.error ? messageId : ""
      }`,
      "aria-labelledby": nameId,
      dir: context.dir,
      ...(isChildRender
        ? {}
        : {
            children: (
              <>
                {children}
                {fileState && (
                  <span id={statusId} className="sr-only">
                    {statusText}
                  </span>
                )}
              </>
            ),
          }),
      ...itemProps,
      className: cn(
        "relative flex items-center gap-2.5 rounded-md border p-3",
        className,
      ),
    },
  });

  return (
    <FileUploadItemContext.Provider value={itemContext}>
      {element}
    </FileUploadItemContext.Provider>
  );
}

export { FileUploadItem };
