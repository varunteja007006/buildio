"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  TRIGGER_NAME,
  useFileUploadContext,
} from "@workspace/ui/components/file-upload-context";
import { useAsRef } from "@workspace/ui/hooks/use-as-ref";

interface FileUploadTriggerProps extends React.ComponentProps<"button"> {
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
}

function FileUploadTrigger(props: FileUploadTriggerProps) {
  const { asChild, children, onClick: onClickProp, ...triggerProps } = props;

  const context = useFileUploadContext(TRIGGER_NAME);

  const propsRef = useAsRef({
    onClick: onClickProp,
  });

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      propsRef.current.onClick?.(event);

      if (event.defaultPrevented) return;

      context.inputRef.current?.click();
    },
    [context.inputRef, propsRef],
  );

  const isChildRender = asChild && React.isValidElement(children);

  return useRender({
    render: isChildRender
      ? children
      : <button data-slot="file-upload-trigger" />,
    props: {
      type: "button",
      "aria-controls": context.inputId,
      "data-disabled": context.disabled ? "" : undefined,
      ...(isChildRender ? {} : { children }),
      ...triggerProps,
      disabled: context.disabled,
      onClick,
    },
  });
}

export { FileUploadTrigger };
