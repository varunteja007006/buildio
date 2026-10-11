import { tool } from "ai";
import { z } from "zod";

import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";

export function buildAgentChatTools(
  toolKeys: string[],
  workspaceId: string,
  topicIds: string[] = [],
) {
  return {
    ...(toolKeys.includes("addResource")
      ? {
          addResource: tool({
            description: `add a resource to your knowledge base.
If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
            inputSchema: z.object({
              content: z
                .string()
                .describe(
                  "the content or resource to add to the knowledge base",
                ),
            }),
            execute: async ({ content }) =>
              createResource(content, workspaceId),
          }),
        }
      : {}),
    ...(toolKeys.includes("getInformation")
      ? {
          getInformation: tool({
            description:
              "get information from your knowledge base to answer questions.",
            inputSchema: z.object({
              question: z.string().describe("the users question"),
            }),
            execute: async ({ question }) =>
              findRelevantContent(question, workspaceId, topicIds),
          }),
        }
      : {}),
  };
}
