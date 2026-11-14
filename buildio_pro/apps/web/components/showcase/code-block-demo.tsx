"use client";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@workspace/ui/components/code-block";
import { FileCode2Icon, TerminalIcon } from "lucide-react";


const installSnippet = `npm install @workspace/ui
pnpm dlx shadcn add code-block
pnpm lint --fix`;

const diffSnippet = `const target = "payments";
const retries = 3;
const retries = 5;
retry(target, retries);`;

export function CodeBlockDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>
            <FileCode2Icon />
            install.sh
          </CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={installSnippet} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers>
          {installSnippet}
        </CodeBlockContent>
        <CodeBlockFooter>
          <span className="font-mono text-xs">bash · 3 lines</span>
        </CodeBlockFooter>
      </CodeBlock>

      <CodeBlock size="sm">
        <CodeBlockHeader>
          <CodeBlockTitle>
            <TerminalIcon />
            diff.patch
          </CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={diffSnippet} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent>
          <CodeBlockLine>const target = &quot;payments&quot;;</CodeBlockLine>
          <CodeBlockLine variant="removed">const retries = 3;</CodeBlockLine>
          <CodeBlockLine variant="added">const retries = 5;</CodeBlockLine>
          <CodeBlockLine variant="highlighted">
            retry(target, retries);
          </CodeBlockLine>
        </CodeBlockContent>
      </CodeBlock>
    </div>
  );
}
