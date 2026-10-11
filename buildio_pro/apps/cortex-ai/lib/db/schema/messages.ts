import { sql } from "drizzle-orm";
import { jsonb, text, timestamp, pgTable, index } from "drizzle-orm/pg-core";

import type { ChatAttachment } from "@/api/chat/types";

import { chatThreads } from "./threads";

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    threadId: text("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    attachments: jsonb("attachments")
      .$type<ChatAttachment[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  },
  (table) => ({
    threadIdx: index("chat_messages_thread_idx").on(table.threadId),
    threadCreatedAtIdx: index("chat_messages_thread_created_at_idx").on(
      table.threadId,
      table.createdAt,
    ),
  }),
);
