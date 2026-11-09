import { Button } from "@workspace/ui/components/button";
import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function Page() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight">Book</h1>
        <p className="mb-6 text-lg text-muted-foreground">Track what you read.</p>
        <Button asChild size="lg">
          <Link href="/home">Open my library</Link>
        </Button>
      </main>
      <MoreAppsFooter current="book" />
      <footer className="border-t border-border p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Buildio.pro
      </footer>
    </div>
  );
}
