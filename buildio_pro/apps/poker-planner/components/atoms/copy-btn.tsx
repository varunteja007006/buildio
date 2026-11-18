"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type CopyBtnProps = {
  text: string;
  children?: React.ReactNode;
  tooltipText?: string;
  disableTooltip?: boolean;
} & React.ComponentProps<"button">;

export function CopyBtn({
  text,
  tooltipText,
  disableTooltip,
  children,
  ...props
}: Readonly<CopyBtnProps>) {
  const handleCopyRoomCode = () => {
    try {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
      console.error("Failed to copy: ", error);
    }
  };

  const button = (
    <Button onClick={handleCopyRoomCode} className="cursor-pointer" {...props}>
      {children ?? <Copy />}
    </Button>
  );

  if (disableTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText ?? "Click to copy"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
