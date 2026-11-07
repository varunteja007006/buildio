import Link from "next/link";

import { LogoutBtn } from "@/components/logout-btn";
import { ModeToggle } from "@/components/mode-toggle";
import { UserCard } from "@/components/user-card";

export function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between px-2 py-1">
      <Link href={"/"}>
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-extrabold text-primary tracking-tight">
            🎄 Secret Santa
          </h1>
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
