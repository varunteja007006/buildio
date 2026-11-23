import type {
  CellData,
  ColumnSort,
  Row,
  RowData,
  TableFeatures,
} from "@tanstack/react-table";

import type { DataTableConfig } from "@workspace/ui/config/data-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import type { FilterItemSchema } from "@workspace/ui/lib/parsers";

/* eslint-disable @typescript-eslint/no-unused-vars -- These generic parameters mirror TanStack Table for declaration merging. */
declare module "@tanstack/react-table" {
  interface TableMeta<TFeatures extends TableFeatures, TData extends RowData> {
    queryKeys?: QueryKeys;
  }

  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */

export interface QueryKeys {
  page: string;
  perPage: string;
  sort: string;
  filters: string;
  joinOperator: string;
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData extends RowData> {
  row: Row<DataTableFeatures, TData>;
  variant: "update" | "delete";
}
