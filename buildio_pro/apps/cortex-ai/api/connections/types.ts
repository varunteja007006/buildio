import type { ConnectorTableTrigger } from "@/lib/connectors/table-triggers";

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

export type SchemaTableStatus = "active" | "removed" | "needs-review";

export type SchemaTable = {
  id: string;
  sourceEpoch: number;
  schemaName: string;
  tableName: string;
  objectType: string;
  databaseComment: string | null;
  status: SchemaTableStatus;
  reviewReason: string | null;
  lastSeenAt: string | null;
  updatedAt: string;
  explanation: string | null;
  revision: number | null;
};

export type SchemaTablePage = {
  tables: SchemaTable[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  lastSync: {
    id: string;
    status: string;
    sourceEpoch: number;
    tableCount: number;
    errorCode: string | null;
    errorMessage: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
  summary: { active: number; removed: number; "needs-review": number };
  schemas: string[];
};

export type SchemaTableDetail = {
  table: {
    id: string;
    sourceEpoch: number;
    sourceObjectId: string | null;
    schemaName: string;
    tableName: string;
    objectType: string;
    databaseComment: string | null;
    status: SchemaTableStatus;
    reviewReason: string | null;
    lastSeenAt: string | null;
    removedAt: string | null;
  };
  context: {
    explanation: string | null;
    revision: number;
    editedBy: string | null;
    updatedAt: string;
  } | null;
  details: ConnectorTableMetadata | null;
  triggers: ConnectorTableTrigger[];
};

export type SchemaRefreshResult = {
  syncId: string | null;
  status: "succeeded" | "failed";
  sourceEpoch: number;
  tableCount: number;
  errorCode: string | null;
  errorMessage: string | null;
};

export type SchemaTableContextInput = {
  explanation: string;
  expectedRevision: number;
};

export type SchemaTableRelinkInput = {
  destinationTableId: string;
  confirm: true;
};
