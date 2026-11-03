"use client";

import { Button } from "@workspace/ui/components/button";
import { useEffect } from "react";

export default function RoomError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3">
      <p className="text-lg font-semibold text-primary">
        🎄 Something went sideways
      </p>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button onClick={reset} className="cursor-pointer">
        Try again
      </Button>
    </div>
  );
}
