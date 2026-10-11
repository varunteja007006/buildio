"use client";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Search } from "lucide-react";

type Props = {
  schemas: string[];
  schema: string;
  objectType: string;
  includeSystemSchemas: boolean;
  search: string;
  onSchemaChange: (schema: string) => void;
  onObjectTypeChange: (type: string) => void;
  onIncludeSystemSchemasChange: (include: boolean) => void;
  onSearchChange: (search: string) => void;
};

const OBJECT_TYPES = [
  ["all", "All types"],
  ["table", "Tables"],
  ["partitioned_table", "Partitioned tables"],
  ["view", "Views"],
  ["materialized_view", "Materialized views"],
  ["foreign_table", "Foreign tables"],
] as const;

export function ConnectorTableFilters({
  schemas,
  schema,
  objectType,
  includeSystemSchemas,
  search,
  onSchemaChange,
  onObjectTypeChange,
  onIncludeSystemSchemasChange,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          aria-label="Search tables"
          className="pl-9"
          placeholder="Search tables or schemas"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <Select value={schema} onValueChange={onSchemaChange}>
        <SelectTrigger className="w-44" aria-label="Filter by schema">
          <SelectValue placeholder="All schemas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All schemas</SelectItem>
          {schemas.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={objectType} onValueChange={onObjectTypeChange}>
        <SelectTrigger className="w-48" aria-label="Filter by object type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OBJECT_TYPES.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex h-9 items-center gap-2 px-1 text-sm text-muted-foreground">
        <Checkbox
          id="include-system-schemas"
          checked={includeSystemSchemas}
          onCheckedChange={(checked) =>
            onIncludeSystemSchemasChange(checked === true)
          }
        />
        <label htmlFor="include-system-schemas">Include system schemas</label>
      </div>
    </div>
  );
}
