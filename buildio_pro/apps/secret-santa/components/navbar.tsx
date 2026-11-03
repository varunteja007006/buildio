import { Gift } from "lucide-react";
import Link from "next/link";

import { LogoutBtn } from "@/components/logout-btn";
import { ModeToggle } from "@/components/mode-toggle";
import { UserCard } from "@/components/user-card";

export function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between px-2 py-1">
      <Link href={"/"}>
        <div className="flex items-center gap-2">
          <Gift className="text-primary size-4" />
          <h1 className="text-primary text-base font-bold">Secret Santa</h1>
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
