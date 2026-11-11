import type { Metadata } from "next";

import { Showcase } from "@/components/showcase/showcase";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Components | Buildio.pro",
  description:
    "Live showcase of the shared @workspace/ui component library: primitives, form controls, overlays, data display, feedback, and navigation.",
};

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <header className="mb-16 flex items-start justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              Component showcase
            </h1>
            <p className="text-muted-foreground">
              Live demos of the flat primitives and curated complex components
              from the shared{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                @workspace/ui
              </code>{" "}
              package.
            </p>
            <p className="text-sm text-muted-foreground">
              Everything is styled with theme tokens only — use the toggle in
              the corner to preview dark mode.
            </p>
          </div>
          <ThemeToggle />
        </header>
        <Showcase />
      </main>
    </div>
  );
}
