import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import { Copyright, Mail } from "lucide-react";

export function Footer() {
  return (
    <>
      <MoreAppsFooter current="poker-planner" />
      <footer className="text-primary bg-background dark:bg-background border-t flex w-full flex-col items-start justify-between gap-5 px-4 py-12 md:flex-row">
        <div className="flex flex-row items-center justify-start gap-2">
          <Mail className="size-4" /> {`Email: varunteja007006@gmail.com`}
        </div>
        <div className="flex flex-row items-center justify-start gap-2">
          <Copyright className="size-4" />{" "}
          {`2025 Poker Planner. All rights reserved.`}
        </div>
      </footer>
    </>
  );
}
