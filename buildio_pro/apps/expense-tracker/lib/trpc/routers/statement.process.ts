import { TRPCError } from "@trpc/server";
import { and, eq, lte, ne, or } from "drizzle-orm";

import {
  extractStatement,
  getDefaultExtractionModel,
  ingestStatementExtraction,
} from "@/lib/ai";
import { statementProcessingCutoff } from "@/lib/statement-processing";
import { getStatementObject } from "@/lib/storage/s3";

import { protectedProcedure } from "../init";
import { processUploadInput } from "./statement.schemas";

export const processUpload = protectedProcedure
  .input(processUploadInput)
  .mutation(async ({ input, ctx }) => {
    const { db, dbSchema, user } = ctx;

    const upload = dbSchema.statementUpload;
    const ownedUpload = and(
      eq(upload.id, input.uploadId),
      eq(upload.userId, user.id),
    );
    const model = input.model ?? getDefaultExtractionModel();
    const attemptStartedAt = new Date();

    const [record] = await db
      .update(upload)
      .set({
        status: "processing",
        processingError: null,
        extractionModel: model,
        ...(input.documentType ? { documentType: input.documentType } : {}),
        updatedAt: attemptStartedAt,
      })
      .where(
        and(
          ownedUpload,
          ne(upload.status, "pending"),
          or(
            ne(upload.status, "processing"),
            lte(
              upload.updatedAt,
              statementProcessingCutoff(attemptStartedAt.getTime()),
            ),
          ),
        ),
      )
      .returning();

    if (!record) {
      const existing = await db.query.statementUpload.findFirst({
        where: ownedUpload,
        columns: { status: true },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload record not found",
        });
      }
      if (existing.status === "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload the file before processing the statement.",
        });
      }
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Another request is processing this statement. Refresh and try again if needed.",
      });
    }

    try {
      const { buffer, contentType } = await getStatementObject(record.s3Key);

      const extraction = await extractStatement({
        buffer,
        contentType,
        filename: record.originalFilename,
        documentType: record.documentType,
        modelId: model,
      });

      const result = await ingestStatementExtraction({
        userId: user.id,
        statementUploadId: input.uploadId,
        attemptStartedAt,
        extractionModel: model,
        extraction,
      });

      return {
        model,
        ...result,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process statement";
      await db
        .update(dbSchema.statementUpload)
        .set({
          status: "failed",
          processingError: message.slice(0, 2000),
          updatedAt: new Date(),
        })
        .where(
          and(
            ownedUpload,
            eq(upload.status, "processing"),
            eq(upload.updatedAt, attemptStartedAt),
          ),
        );

      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message,
      });
    }
  });
