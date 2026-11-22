import { createHash } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { type db, dbSchema } from "@/lib/db";

import type { ExtractedTransaction } from "../schema";
import { CURRENCY_DEFAULTS, slugify } from "./normalizers";

/**
 * Resolves and lazily caches reference rows (currency, bank, payment method,
 * category, ...) for a single ingestion run.
 */
export class ReferenceResolver {
  private currencyCache = new Map<string, string>();
  private bankCache = new Map<string, string>();
  private accountTypeCache = new Map<string, string>();
  private bankAccountCache = new Map<string, string>();
  private paymentProviderCache = new Map<string, string>();
  private paymentMethodCache = new Map<string, string>();
  private categoryCache = new Map<string, string>();

  constructor(
    private readonly userId: string,
    private readonly tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  ) {}

  async currency(code: string): Promise<string> {
    const key = code.trim().toUpperCase();
    const cached = this.currencyCache.get(key);
    if (cached) return cached;

    let row = await this.tx.query.currency.findFirst({
      where: eq(dbSchema.currency.code, key),
    });

    if (!row) {
      const defaults = CURRENCY_DEFAULTS[key] ?? {
        symbol: key,
        name: key,
        symbolNative: key,
        decimalDigits: 2,
      };
      [row] = await this.tx
        .insert(dbSchema.currency)
        .values({
          code: key,
          symbol: defaults.symbol,
          name: defaults.name,
          symbolNative: defaults.symbolNative,
          decimalDigits: defaults.decimalDigits,
          rounding: "0",
        })
        .returning();
    }

    if (!row) throw new Error(`Failed to resolve currency ${key}`);

    this.currencyCache.set(key, row.id);
    return row.id;
  }

  async bank(name: string): Promise<string> {
    const key = name.trim();
    const cached = this.bankCache.get(key);
    if (cached) return cached;

    let row = await this.tx.query.banks.findFirst({
      where: eq(dbSchema.banks.name, key),
    });

    if (!row) {
      [row] = await this.tx
        .insert(dbSchema.banks)
        .values({
          name: key,
          code: slugify(key),
          type: "Bank",
        })
        .returning();
    }

    if (!row) throw new Error(`Failed to resolve bank ${key}`);

    this.bankCache.set(key, row.id);
    return row.id;
  }

  async accountType(name: string): Promise<string> {
    const key = name
      .trim()
      .toUpperCase()
      .replace(/\s+ACCOUNT$/, "");
    const cached = this.accountTypeCache.get(key);
    if (cached) return cached;

    let row = await this.tx.query.bankAccountTypes.findFirst({
      where: eq(dbSchema.bankAccountTypes.name, key),
    });

    if (!row) {
      [row] = await this.tx
        .insert(dbSchema.bankAccountTypes)
        .values({ name: key, description: key })
        .returning();
    }

    if (!row) throw new Error(`Failed to resolve account type ${key}`);

    this.accountTypeCache.set(key, row.id);
    return row.id;
  }

  async bankAccount(input: {
    bankId: string;
    accountTypeId: string;
    masked: string;
    lastFour: string | null;
    currencyId: string;
  }): Promise<string> {
    const matchKey = input.lastFour ?? input.masked;
    const cached = this.bankAccountCache.get(matchKey);
    if (cached) return cached;

    let row = await this.tx.query.userBankAccount.findFirst({
      where: and(
        eq(dbSchema.userBankAccount.user_id, this.userId),
        input.lastFour
          ? eq(dbSchema.userBankAccount.lastFour, input.lastFour)
          : eq(dbSchema.userBankAccount.accountNumberMasked, input.masked),
      ),
    });

    if (!row) {
      [row] = await this.tx
        .insert(dbSchema.userBankAccount)
        .values({
          user_id: this.userId,
          name: input.lastFour
            ? `Bank Account (****${input.lastFour})`
            : `Bank Account (${input.masked})`,
          bankAccountTypeId: input.accountTypeId,
          bankId: input.bankId,
          accountNumberMasked: input.masked,
          accountNumberHash: createHash("sha256")
            .update(input.masked)
            .digest("hex"),
          currencyId: input.currencyId,
          lastFour: input.lastFour,
        })
        .returning();
    }

    if (!row) {
      throw new Error("Failed to resolve or create bank account");
    }

    this.bankAccountCache.set(matchKey, row.id);
    return row.id;
  }

  async paymentMethod(name: string): Promise<string> {
    const key = name.trim().toUpperCase();
    const cached = this.paymentMethodCache.get(key);
    if (cached) return cached;

    let row = await this.tx.query.paymentMethods.findFirst({
      where: eq(dbSchema.paymentMethods.name, key),
    });

    if (!row) {
      let provider = await this.tx.query.paymentProvider.findFirst({
        where: eq(dbSchema.paymentProvider.name, "Banking"),
      });
      if (!provider) {
        [provider] = await this.tx
          .insert(dbSchema.paymentProvider)
          .values({ name: "Banking", description: "Bank payment channels" })
          .returning();
      }
      if (!provider) throw new Error("Failed to resolve payment provider");
      [row] = await this.tx
        .insert(dbSchema.paymentMethods)
        .values({
          name: key,
          description: key,
          paymentProviderId: provider.id,
        })
        .returning();
    }

    if (!row) throw new Error(`Failed to resolve payment method ${key}`);

    this.paymentMethodCache.set(key, row.id);
    return row.id;
  }

  async category(name: string, parentId?: string): Promise<string> {
    const key = `${parentId ?? ""}|${name.trim()}`;
    const cached = this.categoryCache.get(key);
    if (cached) return cached;

    let row = await this.tx.query.expenseCategory.findFirst({
      where: and(
        eq(dbSchema.expenseCategory.name, name.trim()),
        parentId
          ? eq(dbSchema.expenseCategory.parentId, parentId)
          : isNull(dbSchema.expenseCategory.parentId),
      ),
    });

    if (!row) {
      [row] = await this.tx
        .insert(dbSchema.expenseCategory)
        .values({
          name: name.trim(),
          description: name.trim(),
          ...(parentId ? { parentId } : {}),
        })
        .returning();
    }

    if (!row) throw new Error(`Failed to resolve category ${name}`);

    this.categoryCache.set(key, row.id);
    return row.id;
  }

  async resolveCategory(
    transaction: ExtractedTransaction,
  ): Promise<string | null> {
    const category = transaction.category?.trim();
    const subcategory = transaction.subcategory?.trim();
    if (!category) {
      return subcategory ? this.category(subcategory) : null;
    }
    const parentId = await this.category(category);
    return subcategory ? this.category(subcategory, parentId) : parentId;
  }
}
