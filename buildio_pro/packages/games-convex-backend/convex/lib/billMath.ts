export interface Member {
  id: string;
}

export interface Expense {
  amountCents: number;
  payerId: string;
  participantIds: string[];
}

export interface SettlementTransfer {
  fromId: string;
  toId: string;
  amountCents: number;
}

export interface Balance {
  memberId: string;
  netCents: number; // positive = is owed money, negative = owes money
}

export function sumCents(amounts: Iterable<number>): number {
  let total = 0;
  for (const amount of amounts) {
    total += amount;
    if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(total)) {
      throw new Error("Amount exceeds the supported money range");
    }
  }
  return total;
}

/** Preserve participant order: the first participants absorb leftover cents. */
export function splitExpense(members: ReadonlyArray<Member>, expense: Expense) {
  if (!Number.isSafeInteger(expense.amountCents) || expense.amountCents <= 0) {
    throw new Error("Amount must be positive, safe integer cents");
  }
  const memberIds = new Set(members.map((m) => m.id));
  const participants = [...new Set(expense.participantIds)].filter((id) =>
    memberIds.has(id),
  );
  if (!memberIds.has(expense.payerId) || participants.length === 0) {
    throw new Error("Expense must have a group payer and participants");
  }
  const share = Math.floor(expense.amountCents / participants.length);
  const remainder = expense.amountCents % participants.length;
  return participants.map((memberId, index) => ({
    memberId,
    amountCents: share + (index < remainder ? 1 : 0),
  }));
}

export function computeMemberSummary(
  members: ReadonlyArray<Member>,
  expenses: ReadonlyArray<Expense>,
  payments: ReadonlyArray<SettlementTransfer> = [],
) {
  const summaries = new Map(
    members.map((m) => [
      m.id,
      {
        memberId: m.id,
        paidCents: 0,
        shareCents: 0,
        sentCents: 0,
        receivedCents: 0,
        netCents: 0,
      },
    ]),
  );
  for (const expense of expenses) {
    const shares = splitExpense(members, expense);
    const payer = summaries.get(expense.payerId)!;
    payer.paidCents = sumCents([payer.paidCents, expense.amountCents]);
    for (const share of shares) {
      const participant = summaries.get(share.memberId)!;
      participant.shareCents = sumCents([
        participant.shareCents,
        share.amountCents,
      ]);
    }
  }
  for (const payment of payments) {
    const from = summaries.get(payment.fromId);
    const to = summaries.get(payment.toId);
    if (!from || !to || from === to || payment.amountCents <= 0) {
      throw new Error("Invalid repayment");
    }
    from.sentCents = sumCents([from.sentCents, payment.amountCents]);
    to.receivedCents = sumCents([to.receivedCents, payment.amountCents]);
  }
  return [...summaries.values()].map((s) => ({
    ...s,
    netCents: sumCents([
      s.paidCents,
      -s.shareCents,
      s.sentCents,
      -s.receivedCents,
    ]),
  }));
}

export function computeBalances(
  members: ReadonlyArray<Member>,
  expenses: ReadonlyArray<Expense>,
  payments: ReadonlyArray<SettlementTransfer> = [],
): Balance[] {
  return computeMemberSummary(members, expenses, payments).map(
    ({ memberId, netCents }) => ({ memberId, netCents }),
  );
}

/** Greedy matching settles every balance, but need not minimize transfer count. */
export function computeSettlement(
  balances: ReadonlyArray<Balance>,
): SettlementTransfer[] {
  if (sumCents(balances.map((b) => b.netCents)) !== 0) {
    throw new Error("Balances must sum to zero");
  }
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ id: b.memberId, cents: b.netCents }))
    .sort((a, b) => b.cents - a.cents);
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ id: b.memberId, cents: -b.netCents }))
    .sort((a, b) => b.cents - a.cents);
  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amountCents = Math.min(debtor.cents, creditor.cents);
    transfers.push({ fromId: debtor.id, toId: creditor.id, amountCents });
    debtor.cents -= amountCents;
    creditor.cents -= amountCents;
    if (debtor.cents === 0) i += 1;
    if (creditor.cents === 0) j += 1;
  }
  return transfers;
}

export function validateRepayment(
  balances: ReadonlyArray<Balance>,
  payment: SettlementTransfer,
) {
  const from = balances.find((b) => b.memberId === payment.fromId);
  const to = balances.find((b) => b.memberId === payment.toId);
  if (
    !from ||
    !to ||
    from === to ||
    !Number.isSafeInteger(payment.amountCents) ||
    payment.amountCents <= 0 ||
    from.netCents >= 0 ||
    to.netCents <= 0 ||
    payment.amountCents > Math.min(-from.netCents, to.netCents)
  ) {
    throw new Error(
      "Balances changed. Check the latest suggested transfers before recording payment.",
    );
  }
}
