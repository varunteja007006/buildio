import { projects, statuses } from "./task-filters.ts";

type ParseResult = { href: string } | { error: string };

export function parseTaskCommand(command: string): ParseResult {
  const normalized = command
    .trim()
    .replace(/[.!?]+$/, "")
    .trim()
    .replace(/\s+/g, " ");
  const match =
    /^(?:show\s+tasks(?:\s+for\s+(.+))?|show\s+(.+?)\s+tasks(?:\s+for\s+(.+))?)$/i.exec(
      normalized,
    );
  if (!match)
    return { error: "Try ‘Show tasks’ with an optional status and project." };

  const requestedProject = match[1] ?? match[3];
  const requestedStatus = match[2]?.trim().toLowerCase();
  const project =
    requestedProject &&
    projects.find(
      (value) => value.toLowerCase() === requestedProject.trim().toLowerCase(),
    );
  const status =
    requestedStatus === "completed"
      ? "Done"
      : statuses.find((value) => value.toLowerCase() === requestedStatus);

  if (requestedProject && !project)
    return { error: `Unknown project: ${requestedProject.trim()}.` };
  if (requestedStatus && !status)
    return { error: `Unknown status: ${match[2]?.trim()}.` };

  const params = [
    ...(project ? [`project=${encodeURIComponent(project)}`] : []),
    ...(status ? [`status=${encodeURIComponent(status)}`] : []),
  ];
  return { href: `/tasks${params.length ? `?${params.join("&")}` : ""}` };
}
