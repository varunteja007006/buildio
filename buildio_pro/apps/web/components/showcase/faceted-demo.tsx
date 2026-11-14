"use client";

/**
 * Faceted demos for the Extras section:
 * - FacetedSingleDemo: single-select; picking an option closes the popover.
 * - FacetedMultipleDemo: multi-select with FacetedBadgeList showing badges.
 */

import { Button } from "@workspace/ui/components/button";
import {
  Faceted,
  FacetedBadgeList,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedList,
  FacetedTrigger,
} from "@workspace/ui/components/faceted";
import * as React from "react";

const statusOptions = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "in-review", label: "In review" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const techOptions = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "next-js", label: "Next.js" },
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "convex", label: "Convex" },
  { value: "drizzle", label: "Drizzle ORM" },
];

export function FacetedSingleDemo() {
  const [status, setStatus] = React.useState<string | undefined>("in-review");

  return (
    <Faceted value={status} onValueChange={(value) => setStatus(value)}>
      <FacetedTrigger asChild>
        <Button variant="outline" className="w-full font-normal">
          <FacetedBadgeList
            options={statusOptions}
            placeholder="Select status..."
          />
        </Button>
      </FacetedTrigger>
      <FacetedContent>
        <FacetedInput placeholder="Search statuses..." />
        <FacetedList>
          <FacetedEmpty>No statuses found.</FacetedEmpty>
          <FacetedGroup>
            {statusOptions.map((option) => (
              <FacetedItem key={option.value} value={option.value}>
                {option.label}
              </FacetedItem>
            ))}
          </FacetedGroup>
        </FacetedList>
      </FacetedContent>
    </Faceted>
  );
}

export function FacetedMultipleDemo() {
  const [tech, setTech] = React.useState<string[]>(["react", "typescript"]);

  return (
    <Faceted
      multiple
      value={tech}
      onValueChange={(value) => setTech(value ?? [])}
    >
      <FacetedTrigger asChild>
        <Button variant="outline" className="w-full font-normal">
          <FacetedBadgeList
            options={techOptions}
            placeholder="Select technologies..."
          />
        </Button>
      </FacetedTrigger>
      <FacetedContent>
        <FacetedInput placeholder="Search technologies..." />
        <FacetedList>
          <FacetedEmpty>No technologies found.</FacetedEmpty>
          <FacetedGroup>
            {techOptions.map((option) => (
              <FacetedItem key={option.value} value={option.value}>
                {option.label}
              </FacetedItem>
            ))}
          </FacetedGroup>
        </FacetedList>
      </FacetedContent>
    </Faceted>
  );
}
