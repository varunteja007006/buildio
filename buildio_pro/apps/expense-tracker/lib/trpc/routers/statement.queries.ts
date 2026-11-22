import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray, isNotNull } from "drizzle-orm";

import { getDefaultExtractionModel, listGatewayModels } from "@/lib/ai";
import { statementProcessingCutoff } from "@/lib/statement-processing";
import { getPresignedDownloadUrl } from "@/lib/storage/s3";

import { protectedProcedure } from "../init";
import {
  calculatePagination,
  createPaginationMeta,
} from "../schemas/pagination.schema";
import { listStatementsInput, uploadIdInput } from "./statement.schemas";

export const listStatements = protectedProcedure
  .input(listStatementsInput)
  .query(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const filters = [eq(dbSchema.statementUpload.userId, user.id)];

    if (input.documentType) {
      filters.push(
        eq(dbSchema.statementUpload.documentType, input.documentType),
      );
    }

    const whereClause = filters.length === 1 ? filters[0] : and(...filters);

    const [total] = await db
      .select({ count: count() })
      .from(dbSchema.statementUpload)
      .where(whereClause);

    const totalItems = Number(total?.count ?? 0);
    const { offset } = calculatePagination(input, totalItems);

    const records = await db.query.statementUpload.findMany({
      limit: input.limit,
      offset,
      where: whereClause,
      orderBy: (table, { desc }) => desc(table.createdAt),
    });

    const supersededCounts = new Map<string, number>();
    if (records.length > 0) {
      const rows = await db
        .select({
          statementUploadId: dbSchema.financialTransaction.statementUploadId,
          count: count(),
        })
        .from(dbSchema.financialTransaction)
        .where(
          and(
            inArray(
              dbSchema.financialTransaction.statementUploadId,
              records.map((record) => record.id),
            ),
            isNotNull(dbSchema.financialTransaction.supersededAt),
          ),
        )
        .groupBy(dbSchema.financialTransaction.statementUploadId);
      for (const row of rows) {
        if (row.statementUploadId) {
          supersededCounts.set(row.statementUploadId, Number(row.count));
        }
      }
    }

    const cutoff = statementProcessingCutoff();
    return {
      data: records.map((record) => {
        const timedOut =
          record.status === "processing" && record.updatedAt <= cutoff;
        return {
          ...record,
          status: timedOut ? ("failed" as const) : record.status,
          processingError: timedOut
            ? "Processing timed out. Run extraction again to retry."
            : record.processingError,
          supersededTransactionsCount: supersededCounts.get(record.id) ?? 0,
        };
      }),
      meta: createPaginationMeta(input, totalItems),
    };
  });

export const getDownloadUrl = protectedProcedure
  .input(uploadIdInput)
  .query(async ({ input, ctx }) => {
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

    const downloadUrl = await getPresignedDownloadUrl({
      key: record.s3Key,
    });

    return {
      downloadUrl,
      originalFilename: record.originalFilename,
      contentType: record.contentType,
    };
  });

export const listExtractionModels = protectedProcedure.query(async () => {
  const models = await listGatewayModels();
  return { models, defaultModel: getDefaultExtractionModel() };
});
