import assert from "node:assert/strict";
import test from "node:test";

import {
  computeBalances,
  computeMemberSummary,
  computeSettlement,
  splitExpense,
  sumCents,
  validateRepayment,
} from "../../../packages/games-convex-backend/convex/lib/billMath.ts";
import { formatMoney, parseAmountToCents } from "../lib/money.ts";

const members = ["Varun", "Sid", "Indu", "Abarna"].map((id) => ({ id }));
const everyone = members.map((m) => m.id);
const pair = ["Varun", "Sid"];
const expense = (payerId, amountCents, participantIds) => ({
  payerId,
  amountCents,
  participantIds,
});
const trip = [
  ...[8000, 5200, 4000].map((amount) => expense("Varun", amount, pair)),
  expense("Varun", 328700, everyone),
  ...[5000, 2000, 2000, 7000].map((amount) => expense("Sid", amount, pair)),
  expense("Sid", 70000, ["Sid", "Indu"]),
  expense("Sid", 10000, ["Indu"]),
  expense("Abarna", 280000, everyone),
];

test("actual trip totals, individual shares, and repayments remain separate", () => {
  assert.equal(sumCents(trip.map((e) => e.amountCents)), 721900);
  const original = computeMemberSummary(members, trip);
  assert.deepEqual(
    original.map((s) => [s.paidCents, s.shareCents, s.netCents]),
    [
      [345900, 168775, 177125],
      [96000, 203775, -107775],
      [0, 197175, -197175],
      [280000, 152175, 127825],
    ],
  );
  const payments = computeSettlement(computeBalances(members, trip));
  let recorded = [];
  for (const payment of payments) {
    validateRepayment(computeBalances(members, trip, recorded), payment);
    recorded.push(payment);
  }
  assert.ok(
    computeBalances(members, trip, recorded).every((b) => b.netCents === 0),
  );
  assert.deepEqual(
    computeMemberSummary(members, trip, recorded).map((s) => s.shareCents),
    original.map((s) => s.shareCents),
  );
  assert.throws(() =>
    validateRepayment(computeBalances(members, trip, recorded), payments[0]),
  );
  assert.deepEqual(
    computeBalances(members, trip, []),
    computeBalances(members, trip),
  );
  // Expense removal/restoration recalculates outstanding amounts, not recorded payments.
  const afterDelete = computeMemberSummary(members, trip.slice(1), recorded);
  assert.equal(sumCents(afterDelete.map((s) => s.netCents)), 0);
  assert.deepEqual(
    computeBalances(members, trip, recorded),
    computeBalances(members, [...trip], recorded),
  );
});

test("cent remainders, duplicate legacy IDs, excluded payer, and self-only", () => {
  const people = ["A", "B", "C"].map((id) => ({ id }));
  assert.deepEqual(
    splitExpense(people, expense("A", 100, ["A", "B", "C"])).map(
      (s) => s.amountCents,
    ),
    [34, 33, 33],
  );
  assert.deepEqual(
    splitExpense(people, expense("A", 1, ["A", "B", "C"])).map(
      (s) => s.amountCents,
    ),
    [1, 0, 0],
  );
  assert.deepEqual(
    computeBalances(people, [expense("A", 9000, ["A", "B", "B"])]).map(
      (b) => b.netCents,
    ),
    [4500, -4500, 0],
  );
  assert.deepEqual(
    computeBalances(people, [expense("A", 100, ["B", "C"])]).map(
      (b) => b.netCents,
    ),
    [100, -50, -50],
  );
  assert.deepEqual(
    computeSettlement(computeBalances(people, [expense("A", 100, ["A"])])),
    [],
  );
  assert.throws(() => splitExpense(people, expense("missing", 100, ["A"])));
  assert.throws(() => splitExpense(people, expense("A", 100, [])));
  assert.throws(() => computeSettlement([{ memberId: "A", netCents: 10 }]));
});

test("reject invalid money and stale/overpaid or cross-group repayments", () => {
  for (const input of [
    "",
    "0",
    "-1",
    "0.001",
    "1.005",
    "1e3",
    "0x10",
    "Infinity",
    "1,000.00",
    "90071992547409.93",
  ]) {
    assert.ok(Number.isNaN(parseAmountToCents(input)), input);
  }
  for (const [input, cents] of [
    ["12.34", 1234],
    ["12,34", 1234],
    [".5", 50],
    [" 1. ", 100],
    ["0.01", 1],
  ]) {
    assert.equal(parseAmountToCents(input), cents);
  }
  assert.equal(formatMoney(-101, "₹"), "-₹1.01");
  assert.throws(() => sumCents([Number.MAX_SAFE_INTEGER, 1]));
  const balances = computeBalances(members, trip);
  for (const payment of [
    { fromId: "Sid", toId: "Varun", amountCents: 999999 },
    { fromId: "Sid", toId: "Sid", amountCents: 10 },
    { fromId: "unknown", toId: "Varun", amountCents: 10 },
    { fromId: "Varun", toId: "Sid", amountCents: 10 },
    { fromId: "Sid", toId: "Varun", amountCents: 0.5 },
  ])
    assert.throws(() => validateRepayment(balances, payment));
});

test("1000 randomized trips conserve cents and settle exactly", () => {
  let seed = 101;
  const random = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 1000; i++) {
    const people = Array.from({ length: 1 + random(15) }, (_, j) => ({
      id: String(j),
    }));
    const expenses = Array.from({ length: random(30) }, () =>
      expense(
        people[random(people.length)].id,
        1 + random(100000),
        people.filter(() => random(2)).map((m) => m.id),
      ),
    ).filter((e) => e.participantIds.length);
    const summary = computeMemberSummary(people, expenses);
    assert.equal(sumCents(summary.map((s) => s.netCents)), 0);
    assert.equal(
      sumCents(summary.map((s) => s.shareCents)),
      sumCents(expenses.map((e) => e.amountCents)),
    );
    const payments = computeSettlement(summary);
    assert.ok(
      payments.every(
        (p) => Number.isSafeInteger(p.amountCents) && p.amountCents > 0,
      ),
    );
    assert.ok(
      computeBalances(people, expenses, payments).every(
        (b) => b.netCents === 0,
      ),
    );
  }
});
