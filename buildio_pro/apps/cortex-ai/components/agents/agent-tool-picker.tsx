"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useToolboxes } from "@/api/toolboxes/query";
import { toolCatalog } from "@/lib/agents/tool-catalog";

type AgentToolPickerProps = {
  selectedToolKeys: string[];
  selectedToolboxIds: string[];
  onChange: (
    toolKeys: string[],
    toolboxIds: string[],
    droppedToolKeys: string[],
  ) => void;
};

/**
 * Tool picker with the toolbox exclusion rules:
 * - tools inside any toolbox are hidden from the individual list;
 * - attaching a toolbox drops overlapping individual selections.
 */
export function AgentToolPicker({
  selectedToolKeys,
  selectedToolboxIds,
  onChange,
}: AgentToolPickerProps) {
  const { data, isLoading } = useToolboxes(1, 100);
  const toolboxes = useMemo(
    () =>
      (data?.toolboxes ?? []).map((toolbox) => ({
        ...toolbox,
        toolKeys: toolbox.toolKeys ?? [],
      })),
    [data],
  );

  const allToolboxMemberKeys = useMemo(
    () => new Set(toolboxes.flatMap((toolbox) => toolbox.toolKeys)),
    [toolboxes],
  );
  const individualTools = toolCatalog.filter(
    (entry) => !allToolboxMemberKeys.has(entry.key),
  );

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (...values: string[]) =>
    !q || values.some((value) => value.toLowerCase().includes(q));
  const visibleTools = individualTools.filter((entry) =>
    matches(entry.name, entry.description),
  );
  const visibleToolboxes = toolboxes.filter((toolbox) =>
    matches(
      toolbox.name,
      ...toolbox.toolKeys.map(
        (key) => toolCatalog.find((entry) => entry.key === key)?.name ?? key,
      ),
    ),
  );
  const nothingVisible =
    visibleTools.length === 0 && visibleToolboxes.length === 0;

  const toggleTool = (toolKey: string, checked: boolean) => {
    onChange(
      checked
        ? [...selectedToolKeys, toolKey]
        : selectedToolKeys.filter((key) => key !== toolKey),
      selectedToolboxIds,
      [],
    );
  };

  const toggleToolbox = (toolboxId: string, checked: boolean) => {
    if (!checked) {
      onChange(
        selectedToolKeys,
        selectedToolboxIds.filter((id) => id !== toolboxId),
        [],
      );
      return;
    }
    // Exclusion rule: tools inside the selected toolbox drop out of the
    // individual selection (toolbox takes precedence).
    const toolboxKeys =
      toolboxes.find((toolbox) => toolbox.id === toolboxId)?.toolKeys ?? [];
    const dropped = selectedToolKeys.filter((key) =>
      toolboxKeys.includes(key),
    );
    onChange(
      selectedToolKeys.filter((key) => !toolboxKeys.includes(key)),
      [...selectedToolboxIds, toolboxId],
      dropped,
    );
  };

  return (
    <div className="grid gap-2">
      <Label>Tools</Label>
      <p className="text-xs text-muted-foreground">
        Attach individual tools or whole toolboxes. Tools inside toolboxes are
        not individually attachable.
      </p>
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools and toolboxes…"
          className="pl-8"
        />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tools…</p>
      ) : (
        <div className="scrollbar-elegant max-h-56 space-y-4 overflow-y-auto">
          {nothingVisible ? (
            <p className="text-sm text-muted-foreground">
              No tools match “{q}”.
            </p>
          ) : null}
          {visibleTools.length > 0 ? (
            <div className="grid gap-2">
              {individualTools.map((entry) => (
                <label
                  key={entry.key}
                  htmlFor={`agent-tool-${entry.key}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox
                    id={`agent-tool-${entry.key}`}
                    className="mt-0.5"
                    checked={selectedToolKeys.includes(entry.key)}
                    onCheckedChange={(checked) =>
                      toggleTool(entry.key, checked === true)
                    }
                  />
                  <span className="grid gap-0.5">
                    <span className="text-sm leading-5 font-medium">
                      {entry.name}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {entry.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          {visibleToolboxes.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Toolboxes
              </p>
              {visibleToolboxes.map((toolbox) => (
                <label
                  key={toolbox.id}
                  htmlFor={`agent-toolbox-${toolbox.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox
                    id={`agent-toolbox-${toolbox.id}`}
                    className="mt-0.5"
                    checked={selectedToolboxIds.includes(toolbox.id)}
                    onCheckedChange={(checked) =>
                      toggleToolbox(toolbox.id, checked === true)
                    }
                  />
                  <span className="grid gap-0.5">
                    <span className="flex items-center gap-2 text-sm leading-5 font-medium">
                      {toolbox.name}
                      <Badge variant="secondary">
                        {toolbox.toolKeys.length} tools
                      </Badge>
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {toolbox.toolKeys
                        .map(
                          (key) =>
                            toolCatalog.find((entry) => entry.key === key)
                              ?.name ?? key,
                        )
                        .join(", ")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}