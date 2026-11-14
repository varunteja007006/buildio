"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  ITEM_DELETE_NAME,
  useFileUploadItemContext,
  useStoreContext,
} from "@workspace/ui/components/file-upload-context";

interface FileUploadItemDeleteProps extends React.ComponentProps<"button"> {
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}

function FileUploadItemDelete(props: FileUploadItemDeleteProps) {
  const { asChild, children, onClick: onClickProp, ...deleteProps } = props;

  const store = useStoreContext(ITEM_DELETE_NAME);
  const itemContext = useFileUploadItemContext(ITEM_DELETE_NAME);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClickProp?.(event);

      if (!itemContext.fileState || event.defaultPrevented) return;

      store.dispatch({
        type: "REMOVE_FILE",
        file: itemContext.fileState.file,
      });
    },
    [store, itemContext.fileState, onClickProp],
  );

  const isChildRender = asChild && React.isValidElement(children);

  return useRender({
    enabled: Boolean(itemContext.fileState),
    render: isChildRender
      ? children
      : <button data-slot="file-upload-item-delete" />,
    props: {
      type: "button",
      "aria-controls": itemContext.id,
      "aria-describedby": itemContext.nameId,
      ...(isChildRender ? {} : { children }),
      ...deleteProps,
      onClick,
    },
  });
}

export { FileUploadItemDelete };
