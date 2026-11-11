"use client";

import { Button } from "@workspace/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder of the same size to avoid a hydration mismatch layout shift.
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-hidden="true"
        tabIndex={-1}
        className="invisible"
      />
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle light and dark theme"
      title="Toggle light and dark theme"
      className="border-border bg-background text-foreground shadow-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  );
}
