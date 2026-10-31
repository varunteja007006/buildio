export interface SettlementTransfer {
  fromId: string;
  toId: string;
  amountCents: number;
}

export interface Balance {
  memberId: string;
  netCents: number; // positive = is owed money, negative = owes money
}

/**
 * Net balance per member across all expenses. Each expense is split evenly
 * among its participants; a rounding remainder of a few cents is absorbed by
 * the first participants so balances always sum to exactly zero.
 */
export function computeBalances(
  members: ReadonlyArray<{ id: string }>,
  expenses: ReadonlyArray<{
    amountCents: number;
    payerId: string;
    participantIds: string[];
  }>,
): Balance[] {
  const balances = new Map<string, number>();
  for (const member of members) {
    balances.set(member.id, 0);
  }

  for (const expense of expenses) {
    const participants = expense.participantIds.filter((id) =>
      balances.has(id),
    );
    if (participants.length === 0) {
      continue;
    }

    const share = Math.floor(expense.amountCents / participants.length);
    const remainder = expense.amountCents - share * participants.length;

    balances.set(
      expense.payerId,
      (balances.get(expense.payerId) ?? 0) + expense.amountCents,
    );
    participants.forEach((participantId, index) => {
      const extra = index < remainder ? 1 : 0;
      balances.set(
        participantId,
        (balances.get(participantId) ?? 0) - share - extra,
      );
    });
  }

  return members.map((member) => ({
    memberId: member.id,
    netCents: balances.get(member.id) ?? 0,
  }));
}

/**
 * Minimal set of transfers that settles all debts (greedy
 * largest-debtor/largest-creditor matching).
 */
export function computeSettlement(
  balances: ReadonlyArray<Balance>,
): SettlementTransfer[] {
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ id: b.memberId, cents: b.netCents }));
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ id: b.memberId, cents: -b.netCents }));

  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(debtor.cents, creditor.cents);
    transfers.push({
      fromId: debtor.id,
      toId: creditor.id,
      amountCents: amount,
    });
    debtor.cents -= amount;
    creditor.cents -= amount;
    if (debtor.cents === 0) i += 1;
    if (creditor.cents === 0) j += 1;
  }

  return transfers;
}

export function formatMoney(cents: number, currency: string): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const major = Math.floor(abs / 100);
  const minor = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${currency}${major}.${minor}`;
}

/** Parses a user-entered amount into integer cents; NaN when invalid. */
export function parseAmountToCents(input: string): number {
  const normalized = input.replace(",", ".").trim();
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return Number.NaN;
  }
  return Math.round(value * 100);
}
