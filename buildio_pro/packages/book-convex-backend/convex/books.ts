import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// Books are global for now; per-user scoping returns once the app
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

/** Lists all books, newest first, paginated. */
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        id: v.id("books"),
        title: v.string(),
        createdAt: v.number(),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("books")
      .withIndex("by_created")
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      page: result.page.map((book) => ({
        id: book._id,
        title: book.title,
        createdAt: book.createdAt,
      })),
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
  }),
  handler: async (ctx, args) => {
    const book = await requireBook(ctx, args.id);
    return {
      id: book._id,
      title: book.title,
      doc: book.doc ?? null,
      createdAt: book.createdAt,
    };
  },
});

/** Creates a book with a unique title, returning the new id. */
export const create = mutation({
  args: { title: v.string() },
  returns: v.id("books"),
  handler: async (ctx, args) => {
    const title = validatedTitle(args.title.trim());

    // Uniqueness is enforced in the handler (not the schema) across all
    // books, matching the topic module; order is irrelevant for the check.
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
      createdAt: Date.now(),
    });
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
