"use client";

import { Button } from "@workspace/ui/components/button";
import { Loader2, Paperclip, Send, Square, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  CHAT_ATTACHMENT_ACCEPT,
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENTS_SIZE,
  MAX_CHAT_ATTACHMENT_SIZE,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/constants";
import { formatBytes } from "@/lib/file-upload.utils";

type ChatComposerProps = {
  isStreaming: boolean;
  disabled?: boolean;
  attachmentsEnabled?: boolean;
  onSend: (text: string, files: File[]) => Promise<void> | void;
  onStop: () => void;
};

/** Message input with send/stop controls. */
export function ChatComposer({
  isStreaming,
  disabled = false,
  attachmentsEnabled = false,
  onSend,
  onStop,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!CHAT_ATTACHMENT_ACCEPT.split(",").includes(extension)) {
        toast.error(`${file.name}: unsupported file type`);
      } else if (file.size === 0) {
        toast.error(`${file.name}: empty files cannot be attached`);
      } else if (file.size > MAX_CHAT_ATTACHMENT_SIZE) {
        toast.error(`${file.name}: exceeds the 10 MiB file limit`);
      } else if (next.length >= MAX_CHAT_ATTACHMENTS) {
        toast.error(`You can attach up to ${MAX_CHAT_ATTACHMENTS} files`);
      } else if (
        next.reduce((total, current) => total + current.size, 0) + file.size >
        MAX_CHAT_ATTACHMENTS_SIZE
      ) {
        toast.error("Attachments exceed the 20 MiB message limit");
      } else {
        next.push(file);
      }
    }
    setFiles(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && files.length === 0) || isStreaming || isUploading)
      return;
    setIsUploading(files.length > 0);
    try {
      await onSend(
        input.trim() || "Please review the attached file(s).",
        files,
      );
      setInput("");
      setFiles([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t p-4">
      <form onSubmit={submit} className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <textarea
              className="min-w-0 flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              rows={1}
              value={input}
              disabled={disabled || isUploading}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              placeholder="Message…"
              aria-describedby="chat-message-count"
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
            />
            {attachmentsEnabled && !isStreaming && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={CHAT_ATTACHMENT_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    addFiles(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Attach documents"
                  title="Attach documents"
                  disabled={disabled || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            )}
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={onStop}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={
                  (!input.trim() && files.length === 0) ||
                  disabled ||
                  isUploading
                }
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          {files.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs"
                >
                  <Paperclip className="size-3 shrink-0" />
                  <span className="max-w-48 truncate">{file.name}</span>
                  <span className="text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    className="ml-1 rounded-sm text-muted-foreground hover:text-foreground"
                    disabled={isUploading}
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div
            id="chat-message-count"
            className="pt-1 text-right text-xs text-muted-foreground"
          >
            {input.length.toLocaleString()} /{" "}
            {MAX_CHAT_MESSAGE_LENGTH.toLocaleString()} characters
          </div>
        </div>
      </form>
    </div>
  );
}
