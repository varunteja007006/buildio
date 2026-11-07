import React from "react";

import languagesData from "@/app/_components/home/data/languages";
import { Badge } from "@workspace/ui/components/badge";

export default function Languages() {
  return (
    <section id="languages" className="space-y-4">
      <h3 className="text-xl font-semibold">Languages</h3>
      <div className="flex flex-wrap gap-3">
        {languagesData.map((item) => {
          return (
            <Badge
              key={item.language}
              variant="outline"
              className="flex gap-2 px-4 py-2 text-sm font-semibold"
            >
              <span>{item.language}</span>
              <span className="text-muted-foreground font-normal">
                — {item.proficiency}
              </span>
            </Badge>
          );
        })}
      </div>
    </section>
  );
}
