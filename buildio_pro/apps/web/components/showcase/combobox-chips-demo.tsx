"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
  type ComboboxOption,
} from "@workspace/ui/components/combobox";
import * as React from "react";

const tagOptions: ComboboxOption[] = [
  { value: "design", label: "Design" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "docs", label: "Docs" },
];

export function ComboboxChipsDemo() {
  const anchorRef = useComboboxAnchor();
  const [tags, setTags] = React.useState<ComboboxOption[]>(() =>
    tagOptions.slice(0, 1),
  );

  return (
    <div className="w-full max-w-xs">
      <Combobox
        items={tagOptions}
        itemToStringLabel={(option) => option.label}
        multiple
        value={tags}
        onValueChange={(value) => setTags(value)}
      >
        <ComboboxChips ref={anchorRef}>
          {tags.map((tag) => (
            <ComboboxChip key={tag.value}>{tag.label}</ComboboxChip>
          ))}
          <ComboboxChipsInput placeholder="Add tag…" />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef}>
          <ComboboxEmpty>No tags found</ComboboxEmpty>
          <ComboboxList>
            {(option: ComboboxOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
