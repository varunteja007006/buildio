import { cn } from "@/lib/utils";

type CharCountProps = {
  value: string;
  maxLength: number;
  /** Optional extra classes, e.g. "text-right" to align under the field. */
  className?: string;
};

/**
 * Live character counter for length-limited text fields. Renders muted while
 * within the limit and turns destructive when the value exceeds it (possible
 * with data saved before a limit was introduced).
 */
export function CharCount({ value, maxLength, className }: CharCountProps) {
  const over = value.length > maxLength;
  return (
    <p
      className={cn(
        "text-xs",
        over ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {value.length.toLocaleString()} / {maxLength.toLocaleString()}
    </p>
  );
}
