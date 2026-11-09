import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";

export type FolderId = Id<"book_folders">;

/** One row of the convex `bookFolders.list` result. */
export type FolderListItem = {
  id: FolderId;
  name: string;
  parentId: FolderId | null;
  createdAt: number;
  isFavorite: boolean;
};

/** A folder placed in the tree; main folders are depth 1. */
export type FolderNode = FolderListItem & {
  children: FolderNode[];
  depth: number;
};

/** Maximum number of main (top-level) folders. */
export const MAX_MAIN_FOLDERS = 10;

/** Maximum chain length: a main folder (depth 1) plus 5 nested levels. */
export const MAX_FOLDER_DEPTH = 6;

/** Longest allowed folder name (after trimming). */
export const MAX_NAME_LENGTH = 80;

/** Builds a createdAt-ascending tree from a flat folder list. */
export function buildFolderTree(folders: FolderListItem[]): FolderNode[] {
  const nodes = new Map<FolderId, FolderNode>(
    folders.map((folder) => [folder.id, { ...folder, children: [], depth: 1 }]),
  );
  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const root of roots) {
    assignDepth(root, 1);
  }
  sortRecursively(roots);
  return roots;
}

function assignDepth(node: FolderNode, depth: number): void {
  node.depth = depth;
  for (const child of node.children) {
    assignDepth(child, depth + 1);
  }
}

function sortRecursively(nodes: FolderNode[]): void {
  // Favorites first, then creation order within each group.
  nodes.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }
    return a.createdAt - b.createdAt;
  });
  for (const node of nodes) {
    sortRecursively(node.children);
  }
}
