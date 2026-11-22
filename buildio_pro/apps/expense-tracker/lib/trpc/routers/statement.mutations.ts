import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";

import {
  buildStatementKey,
  deleteStatementObject,
  getPresignedUploadUrl,
  statementObjectExists,
} from "@/lib/storage/s3";

import { protectedProcedure } from "../init";
import {
  createUploadInput,
  renameUploadInput,
  uploadIdInput,
} from "./statement.schemas";

export const createUpload = protectedProcedure
  .input(createUploadInput)
  .mutation(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const s3Key = buildStatementKey({
      userId: user.id,
      documentType: input.documentType,
      filename: input.filename,
    });

    const [record] = await db
      .insert(dbSchema.statementUpload)
      .values({
        userId: user.id,
        documentType: input.documentType,
        originalFilename: input.filename,
        s3Key,
        contentType: input.contentType,
        fileSize: input.fileSize,
        status: "pending",
      })
      .returning();

    if (!record) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create upload record",
      });
    }

    const uploadUrl = await getPresignedUploadUrl({
      key: s3Key,
      contentType: input.contentType,
    });

    return {
      uploadId: record.id,
      uploadUrl,
    };
  });

export const completeUpload = protectedProcedure
  .input(uploadIdInput)
  .mutation(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const record = await db.query.statementUpload.findFirst({
      where: and(
        eq(dbSchema.statementUpload.id, input.uploadId),
        eq(dbSchema.statementUpload.userId, user.id),
      ),
    });

    if (!record) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Upload record not found",
      });
    }

    if (record.status !== "pending") return record;

    const uploaded = await statementObjectExists(record.s3Key);
    if (!uploaded) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File was not uploaded to storage. Please try again.",
      });
    }

    const [updated] = await db
      .update(dbSchema.statementUpload)
      .set({
        status: "uploaded",
        uploadedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dbSchema.statementUpload.id, input.uploadId),
          eq(dbSchema.statementUpload.userId, user.id),
          eq(dbSchema.statementUpload.status, "pending"),
        ),
      )
      .returning();

    return updated ?? record;
  });

export const renameUpload = protectedProcedure
  .input(renameUploadInput)
  .mutation(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const record = await db.query.statementUpload.findFirst({
      where: and(
        eq(dbSchema.statementUpload.id, input.uploadId),
        eq(dbSchema.statementUpload.userId, user.id),
      ),
    });

    if (!record) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Upload record not found",
      });
    }

    const [updated] = await db
      .update(dbSchema.statementUpload)
      .set({
        originalFilename: input.filename,
        // During processing, updatedAt identifies the active extraction attempt.
        updatedAt: sql`case when ${dbSchema.statementUpload.status} = 'processing'
          then ${dbSchema.statementUpload.updatedAt} else now() end`,
      })
      .where(eq(dbSchema.statementUpload.id, input.uploadId))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to rename statement",
      });
    }

    return updated;
  });

export const deleteUpload = protectedProcedure
  .input(uploadIdInput)
  .mutation(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const record = await db.query.statementUpload.findFirst({
      where: and(
        eq(dbSchema.statementUpload.id, input.uploadId),
        eq(dbSchema.statementUpload.userId, user.id),
      ),
    });

    if (!record) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Upload record not found",
      });
    }

    await deleteStatementObject(record.s3Key);

    await db
      .delete(dbSchema.statementUpload)
      .where(eq(dbSchema.statementUpload.id, input.uploadId));

    return { success: true };
  });

export const deleteSupersededTransactions = protectedProcedure
  .input(uploadIdInput)
  .mutation(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const record = await db.query.statementUpload.findFirst({
      where: and(
        eq(dbSchema.statementUpload.id, input.uploadId),
        eq(dbSchema.statementUpload.userId, user.id),
      ),
    });

    if (!record) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Upload record not found",
      });
    }

    const deleted = await db
      .delete(dbSchema.financialTransaction)
      .where(
        and(
          eq(dbSchema.financialTransaction.statementUploadId, input.uploadId),
          eq(dbSchema.financialTransaction.userId, user.id),
          isNotNull(dbSchema.financialTransaction.supersededAt),
        ),
      )
      .returning({ id: dbSchema.financialTransaction.id });

    return { deletedCount: deleted.length };
  });
