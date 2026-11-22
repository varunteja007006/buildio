import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull } from "drizzle-orm";
import "server-only";

import { db, dbSchema } from "@/lib/db";
import { runTransactionEnrichment } from "@/lib/transactions";
import { computeTransactionHash } from "@/lib/utils/transaction.utils";

import {
  clampConfidence,
  maskAccountNumber,
  normalizeDate,
  normalizeDirection,
  normalizePaymentMethod,
  normalizeTransactionType,
} from "./ingest/normalizers";
import { ReferenceResolver } from "./ingest/reference-resolver";
import type { StatementExtraction } from "./schema";

export type IngestStatementInput = {
  userId: string;
  statementUploadId: string;
  extractionModel: string;
  attemptStartedAt: Date;
  extraction: StatementExtraction;
};

export type IngestStatementResult = {
  extractedCount: number;
  insertedCount: number;
  skippedCount: number;
  extractionVersion: number;
  supersededCount: number;
  currentCount: number;
  bankAccountId: string | null;
  enrichment: {
    transfersCreated: number;
    refundsLinked: number;
    recurringMarked: number;
  };
};

/**
 * Persists AI-extracted transactions for a statement upload, deduplicating
 * against previously-inserted transactions, then runs enrichment (transfer
 * matching, refund linking, recurring detection).
 *
 * Every successful extraction is stamped with a monotonically increasing
 * version. Rows produced by an earlier extraction for the same upload are
 * soft-deprecated (supersededAt set) so they remain queryable as history but
 * are excluded from all "current" reads.
 */
export async function ingestStatementExtraction(
  input: IngestStatementInput,
): Promise<IngestStatementResult> {
  const {
    userId,
    statementUploadId,
    extractionModel,
    extraction,
    attemptStartedAt,
  } = input;
  const {
    extractionVersion,
    bankAccountId,
    insertedCount,
    currentCount,
    supersededCount,
  } = await db.transaction(async (tx) => {
    const upload = dbSchema.statementUpload;
    // Hold the claim while all reference and transaction writes commit together.
    const [attempt] = await tx
      .select({ extractionVersion: upload.extractionVersion })
      .from(upload)
      .where(
        and(
          eq(upload.id, statementUploadId),
          eq(upload.userId, userId),
          eq(upload.status, "processing"),
          eq(upload.updatedAt, attemptStartedAt),
        ),
      )
      .for("update");

    if (!attempt) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "This processing attempt is no longer active. Refresh the statements list.",
      });
    }

    const resolver = new ReferenceResolver(userId, tx);
    const extractionVersion = attempt.extractionVersion + 1;

    const currencyId = await resolver.currency(
      extraction.statement.currency?.trim() || "INR",
    );

    let bankAccountId: string | null = null;
    const bankName = extraction.statement.bank?.trim();
    const { masked: maskedAccountNumber, lastFour } = maskAccountNumber(
      extraction.statement.accountNumberMasked,
    );
    if (bankName && maskedAccountNumber) {
      const bankId = await resolver.bank(bankName);
      const accountTypeId = await resolver.accountType(
        extraction.statement.accountType?.trim() || "Savings",
      );
      bankAccountId = await resolver.bankAccount({
        bankId,
        accountTypeId,
        masked: maskedAccountNumber,
        lastFour,
        currencyId,
      });
    }

    const rows: (typeof dbSchema.financialTransaction.$inferInsert)[] = [];

    for (const transaction of extraction.transactions) {
      const rawDescription = transaction.rawDescription?.trim();
      if (!rawDescription) {
        throw new Error(
          "A transaction is missing its raw description; refusing to ingest partial data.",
        );
      }

      const date = normalizeDate(transaction.date);
      const amount = Math.abs(Number(transaction.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          `Invalid amount "${transaction.amount}" for transaction on ${date}.`,
        );
      }

      const categoryId = await resolver.resolveCategory(transaction);
      const paymentMethodId = await resolver.paymentMethod(
        normalizePaymentMethod(transaction.paymentMethod ?? "OTHER"),
      );

      rows.push({
        userId,
        bankAccountId,
        statementUploadId,
        extractionVersion,
        transactionDate: new Date(`${date}T12:00:00`),
        amount: amount.toFixed(4),
        currencyId,
        direction: normalizeDirection(transaction.direction),
        transactionType: normalizeTransactionType(transaction.transactionType),
        merchantName: transaction.merchant?.trim() || null,
        counterpartyName: transaction.counterparty?.trim() || null,
        description: transaction.merchant?.trim() || null,
        rawDescription,
        referenceNumber: transaction.referenceNumber?.trim() || null,
        balanceAfter: transaction.balanceAfter?.toFixed(4) ?? null,
        paymentMethodId,
        categoryId,
        isRecurring: transaction.isRecurring,
        isTransfer: transaction.isTransfer,
        isEmi: transaction.isEmi,
        emiInstallmentNumber: transaction.emiInstallmentNumber ?? null,
        emiTotalInstallments: transaction.emiTotalInstallments ?? null,
        international: transaction.international,
        rewardPoints: transaction.rewardPoints?.toFixed(4) ?? null,
        extractionConfidence: clampConfidence(
          Number(transaction.extractionConfidence),
        ).toFixed(4),
        transactionHash: computeTransactionHash({
          bankAccountId,
          date,
          amount,
          referenceNumber: transaction.referenceNumber,
        }),
      });
    }

    const superseded = await tx
      .update(dbSchema.financialTransaction)
      .set({ supersededAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(
            dbSchema.financialTransaction.statementUploadId,
            statementUploadId,
          ),
          eq(dbSchema.financialTransaction.userId, userId),
          isNull(dbSchema.financialTransaction.supersededAt),
        ),
      )
      .returning({ id: dbSchema.financialTransaction.id });

    const inserted = rows.length
      ? await tx
          .insert(dbSchema.financialTransaction)
          .values(rows)
          .onConflictDoNothing()
          .returning({ id: dbSchema.financialTransaction.id })
      : [];

    const [countRow] = await tx
      .select({ count: count() })
      .from(dbSchema.financialTransaction)
      .where(
        and(
          eq(
            dbSchema.financialTransaction.statementUploadId,
            statementUploadId,
          ),
          eq(dbSchema.financialTransaction.userId, userId),
          isNull(dbSchema.financialTransaction.supersededAt),
        ),
      );

    await tx
      .update(dbSchema.statementUpload)
      .set({
        status: "processed",
        processedTransactionsCount: Number(countRow?.count ?? 0),
        extractionVersion,
        extractionModel,
        statementMetadata: {
          ...extraction.statement,
          emiSummary: extraction.emiSummary,
        },
        processingError: null,
        updatedAt: new Date(),
      })
      .where(and(eq(upload.id, statementUploadId), eq(upload.userId, userId)));

    return {
      extractionVersion,
      bankAccountId,
      insertedCount: inserted.length,
      currentCount: Number(countRow?.count ?? 0),
      supersededCount: superseded.length,
    };
  });

  const enrichment = await runTransactionEnrichment({
    db,
    dbSchema,
    userId,
  });

  return {
    extractedCount: extraction.transactions.length,
    insertedCount,
    skippedCount: extraction.transactions.length - insertedCount,
    extractionVersion,
    supersededCount,
    currentCount,
    bankAccountId,
    enrichment,
  };
}
