"use client";

import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { forgetGroup, readRecentGroups } from "@/lib/recent-groups";
import type { RecentGroup } from "@/lib/recent-groups";

export function RecentGroups() {
  const [groups, setGroups] = useState<RecentGroup[]>([]);

  useEffect(() => {
    const refresh = () => setGroups(readRecentGroups());
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  if (!groups.length) return null;

  return (
    <section className="w-full space-y-2" aria-labelledby="recent-groups-title">
      <h2 id="recent-groups-title" className="font-semibold">
        Recent bills
      </h2>
      <p className="text-xs text-muted-foreground">
        Saved only in this browser. Removing a link does not delete the bill.
      </p>
      <ul className="divide-y rounded-lg border">
        {groups.map((group) => (
          <li
            key={group.groupId}
            className="flex min-w-0 items-center gap-2 px-3"
          >
            <Link
              href={`/group/${group.groupId}`}
              className="min-w-0 flex-1 rounded-sm py-3 text-sm hover:underline focus-visible:outline-2"
            >
              <span className="block truncate font-medium">{group.name}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${group.name} from recent bills`}
              onClick={() => {
                forgetGroup(group.groupId);
                setGroups(readRecentGroups());
              }}
            >
              <X aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
