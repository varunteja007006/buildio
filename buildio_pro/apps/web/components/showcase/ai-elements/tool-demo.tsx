"use client";

/**
 * Tool call card demo plus the ai-elements CodeBlock. The CodeBlock here is
 * the shiki-highlighted, language-aware family (distinct from the top-level
 * code-block.tsx demoed in the Content section, which has header/line
 * variants but no syntax highlighting). Static tool input/output, no live
 * tool execution.
 */

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@workspace/ui/components/ai-elements/code-block";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@workspace/ui/components/ai-elements/tool";

const toolInput = { query: "housie winners", limit: 10 };
const toolOutput = { winners: 3, durationMs: 42, table: "round-12" };

const sampleCode = `export function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;

export function ToolDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Tool defaultOpen>
        <ToolHeader
          state="output-available"
          title="searchWinners"
          type="tool-searchWinners"
        />
        <ToolContent>
          <ToolInput input={toolInput} />
          <ToolOutput errorText={undefined} output={toolOutput} />
        </ToolContent>
      </Tool>
      <Tool>
        <ToolHeader state="output-error" type="tool-weather" />
        <ToolContent>
          <ToolOutput
            errorText="Upstream weather API returned 503."
            output={undefined}
          />
        </ToolContent>
      </Tool>
    </div>
  );
}

export function AiCodeBlockDemo() {
  return (
    <CodeBlock code={sampleCode} language="typescript" showLineNumbers>
      <CodeBlockHeader>
        <CodeBlockTitle>greet.ts</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  );
}
