import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

/** Upper bound for the list scan; folders are bounded by the count rules. */
const MAX_FOLDERS = 1000;

/** Maximum number of main (top-level) folders. */
const MAX_MAIN_FOLDERS = 10;

/** Maximum nesting depth; a main folder is depth 1, so 6 nodes per chain. */
const MAX_DEPTH = 6;

/** Longest allowed folder name (after trimming). */
const MAX_NAME_LENGTH = 80;

/** Step cap when walking up the ancestor chain to compute depth. */
const MAX_ANCESTOR_STEPS = 20;

/** Bounded sibling scan for duplicate-name checks under a parent. */
const MAX_SIBLING_SCAN = 200;

/** Computes the depth of a folder (main folder = 1), guarding against cycles. */
async function folderDepth(
  ctx: MutationCtx,
  folder: Doc<"book_folders">,
): Promise<number> {
  let depth = 1;
  let current = folder;
  const visited = new Set<Id<"book_folders">>([current._id]);
  while (current.parent_id !== undefined) {
    if (visited.has(current.parent_id)) {
      throw new Error("Folder hierarchy cycle detected");
    }
    visited.add(current.parent_id);
    if (visited.size > MAX_ANCESTOR_STEPS) {
      throw new Error("Folder hierarchy is too deep");
    }
    const parent = await ctx.db.get(current.parent_id);
    if (parent === null) {
      break;
    }
    current = parent;
    depth++;
  }
  return depth;
}

/** Checks whether a sibling of `excludeId` (or any folder) already uses `name`. */
async function hasSiblingNamed(
  ctx: MutationCtx,
  parentId: Id<"book_folders"> | undefined,
  name: string,
  excludeId?: Id<"book_folders">,
): Promise<boolean> {
  if (parentId !== undefined) {
    const siblings = await ctx.db
      .query("book_folders")
      .withIndex("by_parent", (q) => q.eq("parent_id", parentId))
      .take(MAX_SIBLING_SCAN);
    return siblings.some(
      (sibling) => sibling.name === name && sibling._id !== excludeId,
    );
  }
  // The by_parent index only covers documents where parent_id is defined, so
  // top-level folders are found via the created-at scan. The full bounded scan
  // is needed because nested folders interleave with top-level ones in
  // creation order.
  const folders = await ctx.db
    .query("book_folders")
    .withIndex("by_created_at")
    .order("asc")
    .take(MAX_FOLDERS);
  return folders.some(
    (folder) =>
      folder.parent_id === undefined &&
      folder.name === name &&
      folder._id !== excludeId,
  );
}

/** Lists every folder in creation order. */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("book_folders"),
      name: v.string(),
      parentId: v.union(v.id("book_folders"), v.null()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const folders = await ctx.db
      .query("book_folders")
      .withIndex("by_created_at")
      .order("asc")
      .take(MAX_FOLDERS);
    return folders.map((folder) => ({
      id: folder._id,
      name: folder.name,
      parentId: folder.parent_id ?? null,
      createdAt: folder.created_at,
    }));
  },
});

/** Creates a folder, enforcing depth, main-folder count, and sibling names. */
export const create = mutation({
  args: { name: v.string(), parentId: v.optional(v.id("book_folders")) },
  returns: v.id("book_folders"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError("Folder name cannot be empty");
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ConvexError(
        `Folder name must be at most ${MAX_NAME_LENGTH} characters`,
      );
    }

    if (args.parentId !== undefined) {
      const parent = await ctx.db.get(args.parentId);
      if (parent === null) {
        throw new ConvexError("Parent folder not found");
      }
      const parentDepth = await folderDepth(ctx, parent);
      if (parentDepth + 1 > MAX_DEPTH) {
        throw new ConvexError(
          "Maximum folder nesting depth (5 levels) reached",
        );
      }
    } else {
      const recent = await ctx.db
        .query("book_folders")
        .withIndex("by_created_at")
        .order("asc")
        .take(MAX_MAIN_FOLDERS + 1);
      const topLevelCount = recent.filter(
        (folder) => folder.parent_id === undefined,
      ).length;
      if (topLevelCount >= MAX_MAIN_FOLDERS) {
        throw new ConvexError("Maximum of 10 main folders reached");
      }
    }

    if (await hasSiblingNamed(ctx, args.parentId, name)) {
      throw new ConvexError("A folder with this name already exists here");
    }

    return await ctx.db.insert("book_folders", {
      name,
      parent_id: args.parentId,
      created_at: Date.now(),
    });
  },
});

/** Renames a folder, rejecting empty names and sibling duplicates. */
export const rename = mutation({
  args: { id: v.id("book_folders"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (folder === null) {
      throw new Error("Folder not found");
    }
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError("Folder name cannot be empty");
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ConvexError(
        `Folder name must be at most ${MAX_NAME_LENGTH} characters`,
      );
    }
    if (
      await hasSiblingNamed(ctx, folder.parent_id, name, args.id)
    ) {
      throw new ConvexError("A folder with this name already exists here");
    }
    await ctx.db.patch(args.id, { name });
    return null;
  },
});

/** Deletes a folder together with every nested descendant. Idempotent. */
export const remove = mutation({
  args: { id: v.id("book_folders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.id);
    if (target === null) {
      // Already gone; deleting is idempotent.
      return null;
    }

    const all = await ctx.db
      .query("book_folders")
      .withIndex("by_created_at")
      .order("asc")
      .take(MAX_FOLDERS);
    const childrenOf = new Map<Id<"book_folders">, Id<"book_folders">[]>();
    for (const folder of all) {
      if (folder.parent_id === undefined) {
        continue;
      }
      const siblings = childrenOf.get(folder.parent_id);
      if (siblings) {
        siblings.push(folder._id);
      } else {
        childrenOf.set(folder.parent_id, [folder._id]);
      }
    }

    // Breadth-first collection of the subtree rooted at the target folder.
    const toDelete: Id<"book_folders">[] = [args.id];
    let frontier = toDelete;
    while (frontier.length > 0) {
      const next: Id<"book_folders">[] = [];
      for (const id of frontier) {
        for (const childId of childrenOf.get(id) ?? []) {
          next.push(childId);
        }
      }
      toDelete.push(...next);
      frontier = next;
    }
    for (const id of toDelete) {
      await ctx.db.delete(id);
    }
    return null;
  },
});
