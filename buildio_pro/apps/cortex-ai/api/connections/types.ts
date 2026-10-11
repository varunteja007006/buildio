export type Connection = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  type: string;
  host: string | null;
  port: number | null;
  username: string | null;
  database: string | null;
  target: string;
  status: string;
  lastCheckedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionPage = {
  connections: Connection[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ConnectionInputType = "postgres" | "mongodb";

export type ConnectionInput = {
  name: string;
  type: ConnectionInputType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export type ProbeResult = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
};

export type DeleteResponse = { success: boolean; id: string };

export type ConnectorTrigger = {
  name: string;
  events: string[];
  timing: "BEFORE" | "AFTER" | "INSTEAD OF";
  rowLevel: boolean;
  enabled: "enabled" | "disabled" | "replica" | "always";
  functionSchema: string;
  functionName: string;
};

export type ConnectorTable = {
  schema: string;
  name: string;
  objectType:
    | "table"
    | "partitioned_table"
    | "view"
    | "materialized_view"
    | "foreign_table"
    | "collection";
  triggers: ConnectorTrigger[];
};

export type ConnectorTableMetadata = {
  storage: {
    tableBytes: string;
    indexBytes: string;
    totalBytes: string;
  } | null;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    comment: string | null;
  }[];
  indexes: {
    name: string;
    method: string;
    unique: boolean;
    primary: boolean;
    definition: string;
  }[];
  constraints: {
    name: string;
    type: string;
    definition: string;
  }[];
};

export type ConnectorMetadata = {
  database: string;
  tables: {
    schema: string;
    name: string;
    comment: string | null;
    columns: {
      name: string;
      type: string;
      nullable: boolean;
      primaryKey: boolean;
      comment: string | null;
    }[];
    relationships: {
      column: string;
      referencedSchema: string;
      referencedTable: string;
      referencedColumn: string;
    }[];
  }[];
};
