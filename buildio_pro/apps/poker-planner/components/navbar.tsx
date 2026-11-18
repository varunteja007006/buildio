import { Kanban } from "lucide-react";
import Link from "next/link";

import { LogoutBtn } from "@/components/logout-btn";
import { ModeToggle } from "@/components/mode-toggle";
import { UserCard } from "@/components/user-card";

export function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between md:mb-5 mb-2">
      <Link href={"/"}>
        <div className="flex items-center gap-2">
          <Kanban className="text-primary size-8" />
          <h1 className="text-primary text-xl font-bold">Poker Planner</h1>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <UserCard />
        <ModeToggle />
        <LogoutBtn />
      </div>
    </nav>
  );
}
