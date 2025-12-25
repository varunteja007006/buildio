"use client";

import React from "react";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { toast } from "sonner";

import { cn } from "@workspace/ui/lib/utils";
import contactData from "@/app/_components/home/data/contact";
import { useCopyToClipboard } from "usehooks-ts";

export default function ContactIcons({
  className,
}: Readonly<{ className?: string }>) {
  const [copiedText, copy] = useCopyToClipboard();

  function handleCopy(text: string) {
    copy(text);
    toast(`Copied to your clipboard: ${text}`);
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {contactData.map((item) => {
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "cursor-pointer rounded-full shadow dark:shadow-2xl p-2 bg-card hover:bg-primary/10 hover:shadow-lg",
                  className
                )}
                onClick={() => handleCopy(item.contact_value)}
                aria-label={item.contact_value}
              >
                <item.contact_icon className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{item.contact_value}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
