"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  CLEAR_NAME,
  useFileUploadContext,
  useStore,
  useStoreContext,
} from "@workspace/ui/components/file-upload-context";

interface FileUploadClearProps extends React.ComponentProps<"button"> {
  forceMount?: boolean;
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}

function FileUploadClear(props: FileUploadClearProps) {
  const {
    asChild,
    forceMount,
    disabled,
    children,
    onClick: onClickProp,
    ...clearProps
  } = props;

  const context = useFileUploadContext(CLEAR_NAME);
  const store = useStoreContext(CLEAR_NAME);
  const fileCount = useStore((state) => state.files.size);

  const isDisabled = disabled || context.disabled;

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClickProp?.(event);

      if (event.defaultPrevented) return;

      store.dispatch({ type: "CLEAR" });
    },
    [store, onClickProp],
  );

  const shouldRender = forceMount || fileCount > 0;
  const isChildRender = asChild && React.isValidElement(children);

  return useRender({
    enabled: shouldRender,
    render: isChildRender ? children : <button data-slot="file-upload-clear" />,
    props: {
      type: "button",
      "aria-controls": context.listId,
      "data-disabled": isDisabled ? "" : undefined,
      ...(isChildRender ? {} : { children }),
      ...clearProps,
      disabled: isDisabled,
      onClick,
    },
  });
}

export { FileUploadClear };
