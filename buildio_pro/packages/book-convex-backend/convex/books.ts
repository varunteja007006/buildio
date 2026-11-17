import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// Books are scoped to a topic; per-user scoping returns once the app
// has sign-in set up.

/** Longest allowed book title (after trimming). */
const MAX_TITLE_LENGTH = 200;

/** Upper bound of the scan for the case-insensitive duplicate-title check. */
const MAX_BOOKS = 500;

/** Validates and patches only the fields that actually changed. */
function pickChangedFields(
  book: Doc<"books">,
  patch: Partial<Pick<Doc<"books">, "title" | "doc">>,
): Partial<Pick<Doc<"books">, "title" | "doc">> {
  const changed: Partial<Pick<Doc<"books">, "title" | "doc">> = {};
  if (patch.title !== undefined && patch.title !== book.title) {
    changed.title = patch.title;
  }
  if (patch.doc !== undefined && patch.doc !== book.doc) {
    changed.doc = patch.doc;
  }
  return changed;
}

/** Validates a trimmed title, returning it or throwing a clean error. */
function validatedTitle(title: string): string {
  if (title.length === 0) {
    throw new ConvexError("Book title cannot be empty");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ConvexError(
      `Book title must be at most ${MAX_TITLE_LENGTH} characters`,
    );
  }
  return title;
}

/** Page item shape shared by every book list query. */
const bookItem = v.object({
  id: v.id("books"),
  title: v.string(),
  createdAt: v.number(),
  isFavorite: v.boolean(),
});

/** Paginated result shape shared by the topic and folder bookshelves. */
const paginatedBooks = v.object({
  page: v.array(bookItem),
  isDone: v.boolean(),
  continueCursor: v.union(v.string(), v.null()),
});

/** Maps a stored book to the shared list-item shape. */
const toBookItem = (book: Doc<"books">) => ({
  id: book._id,
  title: book.title,
  createdAt: book.createdAt,
  isFavorite: book.is_favorite === true,
});

/** Loads a book or throws when it does not exist. */
async function requireBook(
  ctx: QueryCtx | MutationCtx,
  id: Id<"books">,
): Promise<Doc<"books">> {
  const book = await ctx.db.get(id);
  if (book === null) {
    throw new ConvexError("Book not found");
  }
  return book;
}

/** Lists a topic's books, newest first, paginated. */
export const list = query({
  args: {
    topicId: v.id("book_topics"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedBooks,
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("books")
      .withIndex("by_topic_created", (q) => q.eq("topic_id", args.topicId))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      page: result.page.map(toBookItem),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/** Fetches one book; `doc` is null until saved. */
export const get = query({
  args: { id: v.id("books") },
  returns: v.object({
    id: v.id("books"),
    title: v.string(),
    doc: v.union(v.string(), v.null()),
    createdAt: v.number(),
    isFavorite: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const book = await requireBook(ctx, args.id);
    return {
      id: book._id,
      title: book.title,
      doc: book.doc ?? null,
      createdAt: book.createdAt,
      isFavorite: book.is_favorite === true,
    };
  },
});

/** Creates a book in a topic with a unique title, returning the new id. */
export const create = mutation({
  args: {
    title: v.string(),
    topicId: v.id("book_topics"),
    folderId: v.optional(v.id("book_folders")),
  },
  returns: v.id("books"),
  handler: async (ctx, args) => {
    const title = validatedTitle(args.title.trim());

    // A folder membership is optional; when present the folder must exist
    // and belong to the same topic as the book.
    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null) {
        throw new ConvexError("Folder not found");
      }
      if (folder.topic_id !== args.topicId) {
        throw new ConvexError("Folder does not belong to this topic");
      }
    }

    // Uniqueness is enforced in the handler (not the schema) and stays
    // global across all topics, matching the current UX; order is
    // irrelevant for the check.
    const books = await ctx.db
      .query("books")
      .withIndex("by_created")
      .take(MAX_BOOKS);
    const lower = title.toLowerCase();
    const duplicate = books.some(
      (book) => book.title.trim().toLowerCase() === lower,
    );
    if (duplicate) {
      throw new ConvexError("A book with this title already exists");
    }

    return await ctx.db.insert("books", {
      title,
      topic_id: args.topicId,
      folder_id: args.folderId,
      createdAt: Date.now(),
    });
  },
});

/** Lists a folder's books, newest first, paginated. */
export const listByFolder = query({
  args: {
    folderId: v.id("book_folders"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedBooks,
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("books")
      .withIndex("by_folder_created", (q) => q.eq("folder_id", args.folderId))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      page: result.page.map(toBookItem),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/** Lists a folder's books for the sidebar tree, newest first, bounded. */
export const listInFolder = query({
  args: { folderId: v.id("book_folders") },
  returns: v.array(bookItem),
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_folder_created", (q) => q.eq("folder_id", args.folderId))
      .order("desc")
      .take(MAX_BOOKS);
    return books.map(toBookItem);
  },
});

/** Patches only the provided, changed fields of the book. */
export const update = mutation({
  args: {
    id: v.id("books"),
    title: v.optional(v.string()),
    doc: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const book = await requireBook(ctx, args.id);
    const patch = pickChangedFields(book, {
      title:
        args.title === undefined
          ? undefined
          : validatedTitle(args.title.trim()),
      doc: args.doc,
    });
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(book._id, patch);
    }
    return null;
  },
});

/** Deletes the book; deleting an already-gone book is idempotent. */
export const remove = mutation({
  args: { id: v.id("books") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.id);
    if (book === null) {
      // Already gone; deleting is idempotent.
      return null;
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

/** Marks or unmarks a book as a favorite. */
export const setFavorite = mutation({
  args: { id: v.id("books"), favorite: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const book = await requireBook(ctx, args.id);
    if (book.is_favorite !== args.favorite) {
      await ctx.db.patch(book._id, { is_favorite: args.favorite });
    }
    return null;
  },
});

/** Counts a topic's books and all favorite books (bounded like the scans). */
export const counts = query({
  args: { topicId: v.id("book_topics") },
  returns: v.object({
    notes: v.number(),
    favorites: v.number(),
  }),
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_topic_created", (q) => q.eq("topic_id", args.topicId))
      .take(MAX_BOOKS);
    const favorites = await ctx.db
      .query("books")
      .withIndex("by_created")
      .take(MAX_BOOKS);
    return {
      notes: books.length,
      favorites: favorites.filter((book) => book.is_favorite === true).length,
    };
  },
});

/** Lists favorite books, newest first, bounded like the shelf scan. */
export const listFavorites = query({
  args: {},
  returns: v.array(bookItem),
  handler: async (ctx) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_created")
      .order("desc")
      .take(MAX_BOOKS);
    return books.filter((book) => book.is_favorite === true).map(toBookItem);
  },
});
