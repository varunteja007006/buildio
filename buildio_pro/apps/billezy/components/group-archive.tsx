"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useConvex } from "convex/react";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { renderGroupArchive } from "@/lib/group-archive";

export function GroupArchive({
  groupId,
  expiresAt,
}: {
  groupId: string;
  expiresAt?: number;
}) {
  const convex = useConvex();
  const [isExporting, setIsExporting] = useState(false);

  const expiry =
    typeof expiresAt === "number" && Number.isFinite(expiresAt)
      ? new Date(expiresAt)
      : null;
  const hasExpiry = expiry !== null && !Number.isNaN(expiry.getTime());

  const download = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const data = await convex.query(api.billArchive.getGroup, {
        groupId: groupId as Id<"bill_groups">,
      });
      if (!data) throw new Error("This bill no longer exists.");
      const html = renderGroupArchive(data, Date.now());
      const url = URL.createObjectURL(
        new Blob([html], { type: "text/html;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `billezy-${groupId}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give browsers time to start the download before releasing the blob.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not download this bill.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <aside className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">
        {hasExpiry ? (
          <>
            Automatically deleted after six months, on or shortly after{" "}
            <time dateTime={expiry!.toISOString()}>
              {expiry!.toLocaleDateString()}
            </time>
            .{" "}
          </>
        ) : (
          "Automatically deleted after six months. "
        )}
        Save an offline copy for your records.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={download}
        disabled={isExporting}
      >
        <Download aria-hidden="true" />{" "}
        {isExporting ? "Preparing…" : "Download HTML"}
      </Button>
    </aside>
  );
}
