"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

type ShareBtnProps = React.ComponentProps<typeof Button>;

export function ShareBtn({ ...props }: Readonly<ShareBtnProps>) {
  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Share link copied");
    } catch (error) {
      toast.error("Failed to copy");
      console.error("Failed to copy: ", error);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={handleCopyLink} className="cursor-pointer" {...props}>
          <Share2 />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Click to share</p>
      </TooltipContent>
    </Tooltip>
  );
}