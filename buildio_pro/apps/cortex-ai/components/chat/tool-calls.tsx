"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  WrenchIcon,
  XIcon,
} from "lucide-react";

export type ToolPart = ToolUIPart | DynamicToolUIPart;

function isSettled(state: ToolPart["state"]): boolean {
  return (
    state === "output-available" ||
    state === "output-error" ||
    state === "output-denied"
  );
}

function StatusIcon({ state }: { state: ToolPart["state"] }) {
  if (state === "output-error" || state === "output-denied") {
    return <XIcon className="size-3.5 text-destructive" />;
  }
  if (state === "output-available") {
    return (
      <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
    );
  }
  return (
    <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
  );
}

function stateLabel(state: ToolPart["state"]): string {
  switch (state) {
    case "input-streaming":
      return "preparing";
    case "input-available":
      return "running";
    case "approval-requested":
      return "needs approval";
    case "approval-responded":
      return "approved";
    case "output-available":
      return "done";
    case "output-error":
      return "error";
    case "output-denied":
      return "denied";
    default:
      return state;
  }
}

function stringify(value: unknown): string {
  if (value === undefined) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ToolBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <pre className="max-h-48 overflow-auto rounded-md bg-background/60 p-2 text-[11px] whitespace-pre-wrap">
        {stringify(value)}
      </pre>
    </div>
  );
}

function ToolCallItem({ part }: { part: ToolPart }) {
  const output = part.state === "output-available" ? part.output : undefined;
  const errorText = part.state === "output-error" ? part.errorText : undefined;

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs">
        <StatusIcon state={part.state} />
        <span className="font-medium">{getToolName(part)}</span>
        <Badge variant="secondary" className="ml-auto font-normal">
          {stateLabel(part.state)}
        </Badge>
      </div>
      <ToolBlock label="Input" value={part.input} />
      {output !== undefined ? <ToolBlock label="Output" value={output} /> : null}
      {errorText ? (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

/** Collapsible summary of the tool calls made during one assistant turn. */
export function ToolCalls({ parts }: { parts: ToolPart[] }) {
  if (parts.length === 0) return null;

  const pending = parts.some((part) => !isSettled(part.state));
  const label = `Used ${parts.length} tool${parts.length === 1 ? "" : "s"}`;

  return (
    <Collapsible
      defaultOpen={pending}
      className="mb-1.5 w-full max-w-[80%] overflow-hidden rounded-xl border bg-muted/40"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <WrenchIcon className="size-3.5" />
        <span className="font-medium">{label}</span>
        <ChevronDownIcon className="ml-auto size-3.5 transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="divide-y border-t">
          {parts.map((part) => (
            <ToolCallItem key={part.toolCallId} part={part} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
