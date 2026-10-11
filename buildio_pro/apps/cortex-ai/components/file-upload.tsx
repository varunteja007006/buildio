"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  FileUploadDropzone,
  FileUploadQueue,
} from "@/components/file-upload-parts";
import {
  formatBytes,
  matchesAccept,
  parseFileSize,
} from "@/lib/file-upload.utils";
import { cn } from "@/lib/utils";

export type FileUploadConfig = {
  /** Value for the native `accept` attribute, e.g. ".pdf,.md,.txt" or "image/*" */
  accept?: string;
  /** Human-readable max size, e.g. "10MB". Used for UI + client-side validation. */
  maxFileSize?: string;
  /** Max number of files allowed in the queue. */
  maxFileCount?: number;
  /** Whether multiple files can be selected/dropped. Default true. */
  multiple?: boolean;
};

export interface FileUploadProps {
  /** Optional document destination (e.g. `{ folderId }`). */
  input?: Record<string, unknown>;
  /** Config that controls validation + UI copy. */
  config?: FileUploadConfig;
  /** Disable the whole dropzone. */
  disabled?: boolean;
  /** Additional container classes. */
  className?: string;
  /** Called when all files are saved successfully. */
  onUploadComplete?: (files: { name: string; key: string }[]) => void;
  /** Called on upload error. */
  onUploadError?: (error: Error) => void;
  /** If true, files are uploaded immediately on drop/select instead of waiting for the button. */
  autoUpload?: boolean;
}

export function FileUpload({
  input,
  config,
  disabled = false,
  className,
  onUploadComplete,
  onUploadError,
  autoUpload = false,
}: FileUploadProps) {
  const {
    accept = ".pdf,.md,.mdx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,image/png,image/jpeg,image/webp,image/gif",
    maxFileSize = "10MB",
    maxFileCount = 10,
    multiple = true,
  } = config ?? {};

  const maxBytes = React.useMemo(
    () => parseFileSize(maxFileSize),
    [maxFileSize],
  );

  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = React.useCallback(
    async (overrideFiles?: File[]) => {
      const toUpload = overrideFiles ?? files;
      if (toUpload.length === 0) {
        toast.error("No files to upload");
        return;
      }
      setIsUploading(true);
      setProgress(0);
      try {
        const uploaded: { name: string; key: string }[] = [];
        for (const [index, file] of toUpload.entries()) {
          const digest = await crypto.subtle.digest(
            "SHA-256",
            await file.arrayBuffer(),
          );
          const fileHash = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
          const details = {
            filename: file.name,
            fileSize: file.size,
            contentType: file.type || "application/octet-stream",
            ...input,
          };
          const setup = await fetch("/api/documents/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          });
          const upload = await setup.json();
          if (!setup.ok) throw new Error(upload.error ?? "Upload setup failed");

          const put = await fetch(upload.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": details.contentType },
          });
          if (!put.ok) throw new Error("Failed to upload file to MinIO");

          const complete = await fetch("/api/documents/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: upload.key,
              filename: file.name,
              fileSize: file.size,
              fileHash,
              folderId: input?.folderId,
            }),
          });
          const result = await complete.json();
          if (!complete.ok)
            throw new Error(result.error ?? "Failed to save document");
          uploaded.push(result);
          setProgress(Math.round(((index + 1) / toUpload.length) * 100));
        }
        toast.success(`${uploaded.length} file(s) uploaded`);
        setFiles([]);
        onUploadComplete?.(uploaded);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
        onUploadError?.(err instanceof Error ? err : new Error(message));
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [files, input, onUploadComplete, onUploadError],
  );

  const addFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;

      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of list) {
        if (!matchesAccept(file, accept)) {
          errors.push(`${file.name}: file type not allowed`);
          continue;
        }
        if (file.size > maxBytes) {
          errors.push(
            `${file.name}: exceeds ${maxFileSize} (${formatBytes(file.size)})`,
          );
          continue;
        }
        valid.push(file);
      }

      if (errors.length > 0) {
        errors.forEach((e) => toast.error(e));
      }
      if (valid.length === 0) return;

      setFiles((prev) => {
        const next = multiple ? [...prev, ...valid] : [...valid].slice(-1);
        if (next.length > maxFileCount) {
          toast.error(`You can only upload up to ${maxFileCount} files`);
          return next.slice(0, maxFileCount);
        }
        if (autoUpload) {
          queueMicrotask(() => {
            void handleUpload(next);
          });
        }
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accept, maxBytes, maxFileSize, maxFileCount, multiple, autoUpload],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => setFiles([]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (disabled || isUploading) return;
    addFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const openFileDialog = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  };

  const allowedText = `${accept} up to ${maxFileSize}`;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <FileUploadDropzone
        accept={accept}
        multiple={multiple}
        maxFileCount={maxFileCount}
        allowedText={allowedText}
        isDragActive={isDragActive}
        isUploading={isUploading}
        disabled={disabled}
        inputRef={inputRef}
        onOpen={openFileDialog}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onInputChange={onInputChange}
        onKeyDown={onKeyDown}
      />

      {files.length > 0 && (
        <FileUploadQueue
          files={files}
          isUploading={isUploading}
          progress={progress}
          autoUpload={autoUpload}
          disabled={disabled}
          onClearAll={clearAll}
          onRemove={removeFile}
          onUpload={() => handleUpload()}
        />
      )}

      {files.length === 0 && !isUploading && (
        <p className="text-center text-xs text-muted-foreground">
          PDF, image, Markdown, or text files up to {maxFileSize}
        </p>
      )}
    </div>
  );
}
