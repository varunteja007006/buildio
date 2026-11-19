import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

import { Fireworks } from "./fireworks";
import { ConfettiSideCannons } from "./reaction-collection";

export function ReactionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="flex flex-col gap-1">
        <DropdownMenuItem asChild>
          <ConfettiSideCannons />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Fireworks />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
