import { MoreAppsFooter } from "@workspace/ui/components/more-apps";

export function Footer() {
  return (
    <>
      <MoreAppsFooter current="cortex-ai" />
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-4 sm:px-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Cortex. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
