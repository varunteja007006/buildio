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
  tooltipText?: string;
} & React.ComponentProps<typeof Button>;

export function CopyBtn({
  text,
  tooltipText,
  children,
  variant,
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleCopyRoomCode}
          className="cursor-pointer"
          variant={variant}
          {...props}
        >
          {children ?? <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText ?? "Click to copy"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
