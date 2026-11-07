import { addYears, differenceInMonths, differenceInYears, parse } from "date-fns";

import experienceData from "./data/experience";

export function parseDate(input: string): Date {
  // Empty → treat as today (useful for current role)
  if (!input) return new Date();

  // Try strict ISO-like format first
  let d = parse(input, "yyyy-MM-dd", new Date());
  if (!isNaN(d.getTime())) return d;

  // Fallback to non-zero-padded format
  d = parse(input, "yyyy-M-d", new Date());
  if (!isNaN(d.getTime())) return d;

  // Final fallback to native Date parsing
  d = new Date(input);
  return d;
}

export function calcExp(date1: string, date2: string) {
  const resigningDate = parseDate(date1);
  const joiningDate = parseDate(date2);

  // Calculate the difference in years
  let years = differenceInYears(resigningDate, joiningDate);
  // Calculate the remaining months after accounting for the years
  let months = differenceInMonths(resigningDate, addYears(joiningDate, years));

  // Handle the case where months are negative
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}

/** Total experience across all shown roles, in whole months (gaps excluded). */
export function getTotalExperienceMonths(): number {
  return experienceData
    .filter((e) => e.toShow)
    .reduce((total, exp) => {
      const start = parseDate(exp.dateOfJoining);
      const end = exp.dateOfResigning ? parseDate(exp.dateOfResigning) : new Date();
      return total + Math.max(0, differenceInMonths(end, start));
    }, 0);
}

/** e.g. "5 years 3 months" */
export function formatTotalExperience(): string {
  const totalMonths = getTotalExperienceMonths();
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return `${years} year${years === 1 ? "" : "s"}${months > 0 ? ` ${months} month${months === 1 ? "" : "s"}` : ""}`;
}

/** Whole years of experience, for "X+ years" style copy. */
export function getExperienceYears(): number {
  return Math.floor(getTotalExperienceMonths() / 12);
}
