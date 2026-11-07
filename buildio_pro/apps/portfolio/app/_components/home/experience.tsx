
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import React from "react";

import experienceData from "./data/experience";
import {
  calcExp,
  formatTotalExperience,
  parseDate,
} from "./experience-utils";

export default function Experience() {
  return (
    <section id="experience" className="space-y-4">
      <h3 className="text-xl font-semibold">
        Experience{" "}
        <span className="text-sm font-normal text-muted-foreground">
          · {formatTotalExperience()} overall
        </span>
      </h3>
      <Card className="py-6 px-6">
        <ExperienceContext />
      </Card>
    </section>
  );
}

const experienceItems = experienceData
  .filter((e) => e.toShow)
  .sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    const da = parseDate(a.dateOfJoining);
    const db = parseDate(b.dateOfJoining);
    return db.getTime() - da.getTime();
  });

function ExperienceContext() {
  return (
    <>
      {experienceItems.map((exp, index) => {
        const rangeLabel = `${exp.workingFrom} — ${exp.workingTill || "Present"}`;
        const duration = calcExp(exp.dateOfResigning || "", exp.dateOfJoining);
        const title = `${exp.jobTitle} · ${exp.company}`;

        return (
          <div
            className="flex flex-col space-y-1.5"
            key={`${exp.company}-${exp.jobTitle}`}
          >
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{`${rangeLabel} (${duration})`}</div>
            <ul className="list-disc pl-5 space-y-1">
              {exp.jobDescription.map((desc, i) => (
                <li key={i}>{desc}</li>
              ))}
            </ul>
            <Separator
              className={cn(
                "my-2",
                index === experienceItems.length - 1 && "hidden",
              )}
            />
          </div>
        );
      })}
    </>
  );
}
