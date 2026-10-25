"use client";

import {
  debounce,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import type { SchemaBrowserFilters } from "@/components/pages/connector-table-browser";

const STATUS_OPTIONS = ["active", "needs-review", "removed", "all"];

const filtersParser = {
  status: parseAsStringEnum(STATUS_OPTIONS).withDefault("active"),
  search: parseAsString
    .withOptions({ limitUrlUpdates: debounce(300) })
    .withDefault(""),
  schema: parseAsString.withDefault("all"),
  objectType: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(1),
};

export function useConnectorSchemaFilters() {
  const [filters, setFiltersState] = useQueryStates(filtersParser);
  const setFilters = (patch: Partial<SchemaBrowserFilters>) =>
    setFiltersState({ ...patch, page: patch.page ?? 1 });
  return { filters: filters as SchemaBrowserFilters, setFilters };
}