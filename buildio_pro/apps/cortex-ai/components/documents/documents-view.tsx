"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  FileText as FileTextIcon,
  ListTree,
  Loader2,
  Table2,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { useInfiniteDocuments } from "@/api/documents/query";
import { useAllFolders } from "@/api/folders/query";
import type { Folder } from "@/api/folders/types";
import { useTopics } from "@/api/topics/query";
import type { Topic } from "@/api/topics/types";
import { DocumentsDialogs } from "@/components/documents/documents-dialogs";
import type { ActionTarget } from "@/components/documents/documents-dialogs";
import { DocumentsTree } from "@/components/documents/documents-tree";
import { NewFolderDialog } from "@/components/documents/new-folder-dialog";
import { NewTopicDialog } from "@/components/documents/new-topic-dialog";
import { UploadDocumentDialog } from "@/components/documents/upload-dialog";
import { DocumentsDataTable } from "@/components/documents-data-table";
import { useDocumentActions } from "@/hooks/use-document-actions";

type ViewMode = "tree" | "table";

export function DocumentsView() {
  const [view, setView] = useState<ViewMode>("tree");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState<Folder | null>(null);
  const [newFolderDefaultTopicId, setNewFolderDefaultTopicId] = useState<
    string | null
  >(null);
  const [renameTarget, setRenameTarget] = useState<ActionTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActionTarget | null>(null);
  /** Folder pinned as the upload destination (tree flow only; null = picker) */
  const [uploadFolder, setUploadFolder] = useState<Folder | null>(null);

  const {
    data: docsInfinite,
    isLoading: docsLoading,
    hasNextPage: docsHasNextPage,
    fetchNextPage: docsFetchNextPage,
    isFetchingNextPage: docsIsFetchingNextPage,
  } = useInfiniteDocuments({ pageSize: 100 });
  const docs = docsInfinite?.pages.flatMap((p) => p.documents) ?? [];
  const { data: topicsData, isLoading: topicsLoading } = useTopics();
  const { data: foldersData, isLoading: foldersLoading } = useAllFolders();

  const topics = topicsData?.topics ?? [];
  const folders = foldersData?.folders ?? [];

  const hasTopics = topics.length > 0;
  const isLoading = topicsLoading || foldersLoading || docsLoading;

  const {
    renamePending,
    renameError,
    handleRenameSubmit,
    deletePending,
    handleDeleteConfirm,
  } = useDocumentActions({
    renameTarget,
    deleteTarget,
    onRenameClose: () => setRenameTarget(null),
    onDeleteClose: () => setDeleteTarget(null),
  });

  const handleUploadClick = () => {
    setUploadFolder(null);
    setUploadOpen(true);
  };

  const handleNewFolderClick = () => {
    setNewFolderParent(null);
    setNewFolderDefaultTopicId(null);
    setFolderDialogOpen(true);
  };

  const handleNewFileInFolder = (folder: Folder) => {
    setSelectedFolderId(folder.id);
    setUploadFolder(folder);
    setUploadOpen(true);
  };

  const handleNewFolderInFolder = (parent: Folder) => {
    setNewFolderParent(parent);
    setNewFolderDefaultTopicId(null);
    setFolderDialogOpen(true);
  };

  const handleNewFolderInTopic = (topic: Topic) => {
    setNewFolderParent(null);
    setNewFolderDefaultTopicId(topic.id);
    setFolderDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasTopics) {
    return (
      <>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>Create a topic to get started</EmptyTitle>
            <EmptyDescription>
              Documents are organized into topics and folders. Create your first
              topic before uploading anything.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button onClick={() => setTopicDialogOpen(true)}>New Topic</Button>
          </EmptyContent>
        </Empty>
        <NewTopicDialog
          open={topicDialogOpen}
          onOpenChange={setTopicDialogOpen}
        />
      </>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup
          value={[view]}
          onValueChange={(value) => value[0] && setView(value[0] as ViewMode)}
        >
          <ToggleGroupItem value="tree" aria-label="Tree view">
            <ListTree className="size-4" />
            Tree
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <Table2 className="size-4" />
            Table
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTopicDialogOpen(true)}>
            New Topic
          </Button>
          <Button variant="outline" onClick={handleNewFolderClick}>
            New Folder
          </Button>
          <Button onClick={handleUploadClick}>
            <Upload data-icon="inline-start" />
            Upload
          </Button>
        </div>
      </div>

      {view === "tree" ? (
        <div className="flex w-full flex-col gap-2">
          <DocumentsTree
            topics={topics}
            folders={folders}
            documents={docs}
            hasNextPage={docsHasNextPage}
            isFetchingNextPage={docsIsFetchingNextPage}
            fetchNextPage={docsFetchNextPage}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onRenameTopic={(topic) =>
              setRenameTarget({ kind: "topic", id: topic.id, name: topic.name })
            }
            onDeleteTopic={(topic) =>
              setDeleteTarget({ kind: "topic", id: topic.id, name: topic.name })
            }
            onRenameFolder={(folder) =>
              setRenameTarget({
                kind: "folder",
                id: folder.id,
                name: folder.name,
              })
            }
            onDeleteFolder={(folder) =>
              setDeleteTarget({
                kind: "folder",
                id: folder.id,
                name: folder.name,
              })
            }
            onNewFileInFolder={handleNewFileInFolder}
            onNewFolderInFolder={handleNewFolderInFolder}
            onNewFolderInTopic={handleNewFolderInTopic}
          />
        </div>
      ) : (
        <DocumentsDataTable />
      )}

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folderName={uploadFolder?.name ?? null}
        folderId={uploadFolder?.id ?? null}
        topicId={uploadFolder?.topicId ?? null}
        topics={topics}
        folders={folders}
      />

      <NewTopicDialog
        open={topicDialogOpen}
        onOpenChange={setTopicDialogOpen}
      />

      <NewFolderDialog
        key={
          folderDialogOpen
            ? (newFolderParent?.id ?? newFolderDefaultTopicId ?? "root")
            : "new-folder-closed"
        }
        open={folderDialogOpen}
        onOpenChange={(open) => {
          setFolderDialogOpen(open);
          if (!open) {
            setNewFolderParent(null);
            setNewFolderDefaultTopicId(null);
          }
        }}
        topics={topics}
        parentFolder={newFolderParent}
        defaultTopicId={newFolderDefaultTopicId}
      />

      <DocumentsDialogs
        renameTarget={renameTarget}
        onRenameClose={() => setRenameTarget(null)}
        renamePending={renamePending}
        renameError={renameError}
        onRenameSubmit={handleRenameSubmit}
        deleteTarget={deleteTarget}
        onDeleteClose={() => setDeleteTarget(null)}
        deletePending={deletePending}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
