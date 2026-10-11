"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { documentKeys } from "@/api/documents/query";
import type { Folder } from "@/api/folders/types";
import type { Topic } from "@/api/topics/types";
import { FileUpload, type FileUploadConfig } from "@/components/file-upload";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Destination folder chosen from the tree (skips the topic/folder picker) */
  folderName?: string | null;
  folderId?: string | null;
  topicId?: string | null;
  /** Topics/folders for the picker shown when no tree folder is selected */
  topics?: Topic[];
  folders?: Folder[];
  /** Optional config to override defaults (accept, maxFileSize, maxFileCount, multiple) */
  config?: FileUploadConfig;
}

/**
 * Upload dialog that wraps the reusable `FileUpload` drag-and-drop component.
 * Keeps a sticky header + footer and a scrollable body (max-h-[85vh]).
 * Forwards the selected folder so the server can link the stored document row.
 *
 * Two modes:
 * - Tree flow: a folder was selected in the tree, so the destination is fixed.
 * - Picker flow: opened from the header without a tree selection — pick a
 *   topic, then a folder, before uploading.
 */
export function UploadDocumentDialog({
  open,
  onOpenChange,
  folderName = null,
  folderId = null,
  topicId = null,
  topics = [],
  folders = [],
  config,
}: UploadDocumentDialogProps) {
  const [pickedTopicId, setPickedTopicId] = useState("");
  const [pickedFolderId, setPickedFolderId] = useState("");
  const queryClient = useQueryClient();

  const pickerMode = !folderId;

  useEffect(() => {
    if (open) {
      setPickedTopicId("");
      setPickedFolderId("");
    }
  }, [open]);

  const effectiveFolderId = folderId ?? (pickedFolderId || null);
  const pickedFolder = folders.find((f) => f.id === pickedFolderId);
  const effectiveFolderName = folderName ?? pickedFolder?.name ?? null;
  const effectiveTopicId = topicId ?? pickedFolder?.topicId ?? null;
  const topicFolders = folders.filter((f) => f.topicId === pickedTopicId);

  const handleComplete = () => {
    // Refresh the documents table/tree after a successful MinIO upload.
    void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    toast.success("Documents queued for ingestion");
    onOpenChange(false);
  };

  const isReady = Boolean(effectiveFolderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sticky top-0 z-10 shrink-0 border-b bg-popover p-4">
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            {pickerMode ? (
              "Choose a topic and folder, then drop your files."
            ) : isReady ? (
              <>
                Uploading to{" "}
                <span className="font-medium text-foreground">
                  {effectiveFolderName}
                </span>
                . Large files may take a moment to process.
              </>
            ) : (
              "Select a folder before uploading."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {pickerMode && (
            <div className="grid gap-2">
              <Label htmlFor="upload-topic">Topic</Label>
              <Select
                value={pickedTopicId}
                onValueChange={(value) => {
                  setPickedTopicId(value);
                  setPickedFolderId("");
                }}
              >
                <SelectTrigger id="upload-topic" className="w-full">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="upload-folder">Folder</Label>
              <Select
                value={pickedFolderId}
                onValueChange={setPickedFolderId}
                disabled={!pickedTopicId}
              >
                <SelectTrigger id="upload-folder" className="w-full">
                  <SelectValue
                    placeholder={
                      pickedTopicId
                        ? topicFolders.length === 0
                          ? "No folders in this topic"
                          : "Select a folder"
                        : "Select a topic first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {topicFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isReady ? (
            <FileUpload
              key={`${effectiveFolderId}-${open ? "open" : "closed"}`}
              input={{
                ...(effectiveFolderId ? { folderId: effectiveFolderId } : {}),
                ...(effectiveTopicId ? { topicId: effectiveTopicId } : {}),
              }}
              config={
                config ?? {
                  accept:
                    ".pdf,.md,.mdx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,image/png,image/jpeg,image/webp,image/gif",
                  maxFileSize: "10MB",
                  maxFileCount: 10,
                  multiple: true,
                }
              }
              onUploadComplete={handleComplete}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Pick a topic and folder to start uploading.
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 z-10 m-0 shrink-0 rounded-none bg-popover p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
