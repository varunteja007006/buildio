import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import { Dices } from "lucide-react";

import HousieNumGenerator from "@/components/housie-num-generator";

import { ModeToggle } from "../components/mode-toggle";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl flex flex-row gap-2 font-bold tracking-tight">
          <span>
            <Dices className="size-8" />
          </span>{" "}
          Housie
        </h1>
        <nav className="space-x-6">
          <ModeToggle />
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4">
        <HousieNumGenerator />
      </main>

      {/* Footer */}
      <MoreAppsFooter current="housie-game" />
      <footer className="text-center mt-10 text-gray-500 p-4 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} Buildio.pro — Crafted with ❤️
      </footer>
    </div>
  );
}
