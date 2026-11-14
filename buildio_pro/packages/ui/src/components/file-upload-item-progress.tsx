"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  ITEM_PROGRESS_NAME,
  useFileUploadItemContext,
} from "@workspace/ui/components/file-upload-context";
import { cn } from "@workspace/ui/lib/utils";

interface FileUploadItemProgressProps extends React.ComponentProps<"div"> {
  variant?: "linear" | "circular" | "fill";
  size?: number;
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
  forceMount?: boolean;
}

function FileUploadItemProgress(props: FileUploadItemProgressProps) {
  const {
    variant = "linear",
    size = 40,
    asChild,
    forceMount,
    children,
    className,
    ...progressProps
  } = props;

  const itemContext = useFileUploadItemContext(ITEM_PROGRESS_NAME);

  const fileState = itemContext.fileState;
  const progress = fileState?.progress ?? 0;
  const shouldRender = Boolean(fileState) && (forceMount || progress !== 100);
  const isChildRender = asChild && React.isValidElement(children);

  // Variant-specific content, class, and style are computed up front so the
  // single top-level useRender call below honors the rules of hooks.
  let content: React.ReactNode;
  let variantClassName: string;
  let variantStyle: React.CSSProperties | undefined;

  switch (variant) {
    case "circular": {
      const circumference = 2 * Math.PI * ((size - 4) / 2);
      const strokeDashoffset = circumference - (progress / 100) * circumference;

      content = (
        <svg
          className="-rotate-90 transform"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          stroke="currentColor"
        >
          <circle
            className="text-primary/20"
            strokeWidth="2"
            cx={size / 2}
            cy={size / 2}
            r={(size - 4) / 2}
          />
          <circle
            className="text-primary transition-[stroke-dashoffset] duration-300 ease-linear"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            cx={size / 2}
            cy={size / 2}
            r={(size - 4) / 2}
          />
        </svg>
      );
      variantClassName =
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      break;
    }

    case "fill": {
      content = null;
      variantClassName =
        "absolute inset-0 bg-primary/50 transition-[clip-path] duration-300 ease-linear";
      variantStyle = { clipPath: `inset(${100 - progress}% 0% 0% 0%)` };
      break;
    }

    default: {
      content = (
        <div
          className="h-full w-full flex-1 bg-primary transition-transform duration-300 ease-linear"
          style={{
            transform: `translateX(-${100 - progress}%)`,
          }}
        />
      );
      variantClassName =
        "relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20";
    }
  }

  return useRender({
    enabled: shouldRender,
    render: isChildRender ? children : <div data-slot="file-upload-progress" />,
    props: {
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": progress,
      "aria-valuetext": `${progress}%`,
      "aria-labelledby": itemContext.nameId,
      ...(isChildRender ? {} : { children: content }),
      ...progressProps,
      className: cn(variantClassName, className),
      ...(variantStyle ? { style: variantStyle } : {}),
    },
  });
}

export { FileUploadItemProgress };
