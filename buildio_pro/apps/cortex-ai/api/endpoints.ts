export const endpoints = {
  chat: {
    stream: "/chat",
    threads: "/chat/threads",
    thread: (id: string) => `/chat/threads/${id}`,
    threadRestore: (id: string) => `/chat/threads/${id}/restore`,
    messageFeedback: (threadId: string, messageId: string) =>
      `/chat/threads/${threadId}/messages/${messageId}/feedback`,
    attachments: "/chat/attachments",
    models: "/chat/models",
    preferences: "/chat/preferences",
  },
  resources: {
    list: "/resources",
    detail: (id: string) => `/resources/${id}`,
  },
  workspaces: {
    list: "/workspaces",
    active: "/workspaces/active",
    detail: (id: string) => `/workspaces/${id}`,
    restore: (id: string) => `/workspaces/${id}/restore`,
    activate: (id: string) => `/workspaces/${id}/activate`,
  },
  auditLogs: {
    list: "/audit-logs",
  },
  documentAuditLogs: {
    list: "/document-audit-logs",
  },
  extractionTemplates: {
    list: "/extraction-templates",
    generate: "/extraction-templates/generate",
    detail: (id: string) => `/extraction-templates/${id}`,
    restore: (id: string) => `/extraction-templates/${id}/restore`,
    permanent: (id: string) => `/extraction-templates/${id}/permanent`,
  },
  agents: {
    list: "/agents",
    detail: (id: string) => `/agents/${id}`,
    restore: (id: string) => `/agents/${id}/restore`,
    permanent: (id: string) => `/agents/${id}/permanent`,
    deploy: (id: string) => `/agents/${id}/deploy`,
    undeploy: (id: string) => `/agents/${id}/undeploy`,
    topics: (id: string) => `/agents/${id}/topics`,
    topic: (id: string, topicId: string) =>
      `/agents/${id}/topics?topicId=${topicId}`,
    tools: (id: string) => `/agents/${id}/tools`,
    tool: (id: string, toolKey: string) =>
      `/agents/${id}/tools?toolKey=${encodeURIComponent(toolKey)}`,
    agentToolbox: (id: string, toolboxId: string) =>
      `/agents/${id}/tools?toolboxId=${toolboxId}`,
    feedback: (id: string) => `/agents/${id}/feedback`,
  },
  toolboxes: {
    list: "/toolboxes",
    detail: (id: string) => `/toolboxes/${id}`,
    restore: (id: string) => `/toolboxes/${id}/restore`,
    permanent: (id: string) => `/toolboxes/${id}/permanent`,
    tools: (id: string) => `/toolboxes/${id}/tools`,
    tool: (id: string, toolKey: string) =>
      `/toolboxes/${id}/tools?toolKey=${encodeURIComponent(toolKey)}`,
  },
  agentTemplates: {
    list: "/agent-templates",
    detail: (id: string) => `/agent-templates/${id}`,
    restore: (id: string) => `/agent-templates/${id}/restore`,
    permanent: (id: string) => `/agent-templates/${id}/permanent`,
  },
  connections: {
    list: "/connections",
    test: "/connections/test",
    detail: (id: string) => `/connections/${id}`,
    restore: (id: string) => `/connections/${id}/restore`,
    permanent: (id: string) => `/connections/${id}/permanent`,
    check: (id: string) => `/connections/${id}/check`,
    context: (id: string) => `/connections/${id}/context`,
    descriptionPreview: (id: string) =>
      `/connections/${id}/description/preview`,
    descriptionGenerate: (id: string) =>
      `/connections/${id}/description/generate`,
    schema: (id: string) => `/connections/${id}/schema`,
    schemaRefresh: (id: string) => `/connections/${id}/schema/refresh`,
    schemaTable: (id: string, tableId: string) =>
      `/connections/${id}/schema/tables/${tableId}`,
    schemaTableContext: (id: string, tableId: string) =>
      `/connections/${id}/schema/tables/${tableId}/context`,
    schemaTableRelink: (id: string, tableId: string) =>
      `/connections/${id}/schema/tables/${tableId}/relink`,
  },
  ingest: {
    run: "/ingest",
    status: "/ingest/status",
  },
  extractions: {
    list: "/extraction",
    documents: "/extraction/documents",
    detail: (id: string) => `/extraction/${id}`,
    run: (id: string) => `/extraction/${id}/run`,
    versions: (id: string) => `/extraction/${id}/versions`,
    restore: (id: string) => `/extraction/${id}/restore`,
  },
  documents: {
    list: "/documents",
    detail: (id: string) => `/documents/${id}`,
    restore: (id: string) => `/documents/${id}/restore`,
    permanent: (id: string) => `/documents/${id}/permanent`,
    trash: "/documents/trash",
  },
  folders: {
    list: "/folders",
    detail: (id: string) => `/folders/${id}`,
    restore: (id: string) => `/folders/${id}/restore`,
    permanent: (id: string) => `/folders/${id}/permanent`,
  },
  topics: {
    list: "/topics",
    detail: (id: string) => `/topics/${id}`,
    restore: (id: string) => `/topics/${id}/restore`,
    permanent: (id: string) => `/topics/${id}/permanent`,
  },
  dashboard: {
    stats: "/dashboard",
  },
} as const;
