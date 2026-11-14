"use client";

/**
 * Prompt input demo — full form shell with an attachment action menu, model
 * select, tool buttons and a submit control. Static: submitting just toasts
 * the captured message and echoes it below.
 */

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@workspace/ui/components/ai-elements/prompt-input";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MODELS = [
  { label: "Claude Sonnet 4.5", value: "claude-sonnet" },
  { label: "GPT-5", value: "gpt-5" },
  { label: "Gemini 3 Pro", value: "gemini-pro" },
];

export function PromptInputDemo() {
  const [model, setModel] = useState("claude-sonnet");
  const [webSearch, setWebSearch] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  // The uncontrolled textarea is reset by PromptInput itself after a sync
  // onSubmit, so no manual clearing is needed here.
  const handleSubmit = (message: PromptInputMessage) => {
    const count = message.files.length;
    const text = message.text.trim() || "(empty message)";
    const summary = count > 0 ? `${text} — ${count} attachment(s)` : text;
    const optionNote = [model, webSearch ? "web search" : null]
      .filter(Boolean)
      .join(" · ");

    toast("Prompt submitted", { description: optionNote });
    setSent(summary);
  };

  return (
    <div className="w-full space-y-3">
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputHeader>
            <PromptInputSelect onValueChange={setModel} value={model}>
              <PromptInputSelectTrigger size="sm">
                <PromptInputSelectValue />
              </PromptInputSelectTrigger>
              <PromptInputSelectContent>
                {MODELS.map((m) => (
                  <PromptInputSelectItem key={m.value} value={m.value}>
                    {m.label}
                  </PromptInputSelectItem>
                ))}
              </PromptInputSelectContent>
            </PromptInputSelect>
          </PromptInputHeader>

          <PromptInputTextarea placeholder="Ask anything — Enter sends, Shift+Enter adds a newline" />

          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger tooltip="Attach photos or files" />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionMenuItem
                    onSelect={() =>
                      toast("Command palette is not wired in this demo")
                    }
                  >
                    Run command…
                  </PromptInputActionMenuItem>
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputButton
                onClick={() => setWebSearch((v) => !v)}
                tooltip={{
                  content: "Search the web before answering",
                  shortcut: "⌘W",
                  side: "top",
                }}
                variant={webSearch ? "default" : "ghost"}
              >
                <SearchIcon className="size-4" />
                Web search
              </PromptInputButton>
            </PromptInputTools>

            <PromptInputSubmit status="ready" />
          </PromptInputFooter>
        </PromptInputBody>
      </PromptInput>

      <p className="text-muted-foreground text-xs">
        {sent ? `Sent: ${sent}` : "Type a prompt and hit Enter to submit."}
      </p>
    </div>
  );
}
