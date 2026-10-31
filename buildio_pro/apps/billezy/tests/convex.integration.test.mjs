import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";

import { computeBalances } from "../../../packages/games-convex-backend/convex/lib/billMath.ts";

const url = process.env.BILLEZY_TEST_CONVEX_URL;

test(
  "development backend: expenses, repayments, undo, trash, and group scoping",
  { skip: !url },
  async () => {
    const call = async (kind, path, args) => {
      const response = await fetch(`${url}/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, args, format: "json" }),
      });
      const result = await response.json();
      if (result.status !== "success")
        throw new Error(result.errorMessage ?? JSON.stringify(result));
      return result.value;
    };
    const mutate = (path, args) => call("mutation", path, args);
    const groupIds = [];
    try {
      const create = async (name) => {
        const created = await mutate("bills:createGroup", {
          name,
          currency: "₹",
          memberNames: ["A", "B", "C"],
        });
        groupIds.push(created.groupId);
        return created;
      };
      const first = await create(`Billezy automated check ${Date.now()}`);
      const other = await create(`Billezy scope check ${Date.now()}`);
      const {
        groupId,
        memberIds: [a, b, c],
      } = first;
      const args = {
        groupId,
        description: "Test lunch",
        amountCents: 10000,
        payerId: a,
        participantIds: [a, b, c],
      };
      const read = () => call("query", "bills:getGroup", { groupId });
      const expenseId = await mutate("bills:addExpense", args);
      for (const invalid of [
        { participantIds: [a, b, b] },
        { participantIds: [] },
        { payerId: other.memberIds[0] },
        { participantIds: [other.memberIds[0]] },
        { amountCents: 1.5 },
        { amountCents: Number.MAX_SAFE_INTEGER + 1 },
      ])
        await assert.rejects(() =>
          mutate("bills:addExpense", { ...args, ...invalid }),
        );
      await assert.rejects(() =>
        mutate("billEdits:updateExpense", {
          groupId,
          expenseId,
          description: "Bad",
          amountCents: 100,
          participantIds: [a, a],
        }),
      );
      await assert.rejects(() =>
        mutate("billEdits:updateExpense", {
          groupId: other.groupId,
          expenseId,
          description: "Wrong group",
          amountCents: 100,
          participantIds: [a],
        }),
      );
      const repayment = { groupId, fromId: b, toId: a, amountCents: 3333 };
      await assert.rejects(() =>
        mutate("billPayments:recordPayment", {
          ...repayment,
          fromId: other.memberIds[0],
        }),
      );
      const concurrent = await Promise.allSettled([
        mutate("billPayments:recordPayment", repayment),
        mutate("billPayments:recordPayment", repayment),
      ]);
      assert.equal(
        concurrent.filter((r) => r.status === "fulfilled").length,
        1,
      );
      let group = await read();
      assert.equal(group.payments.length, 1);
      assert.equal(
        computeBalances(group.members, group.expenses, group.payments).find(
          (s) => s.memberId === b,
        ).netCents,
        0,
      );
      const paymentId = group.payments[0].id;
      await assert.rejects(() =>
        mutate("billPayments:undoPayment", {
          groupId: other.groupId,
          paymentId,
        }),
      );
      await assert.rejects(() =>
        mutate("bills:deleteExpense", { groupId: other.groupId, expenseId }),
      );
      await mutate("bills:deleteExpense", { groupId, expenseId });
      group = await read();
      assert.equal(group.expenses.length, 0);
      assert.equal(group.payments.length, 1);
      const listTrash = () =>
        call("query", "billTrash:listExpenses", {
          groupId,
          paginationOpts: { numItems: 20, cursor: null },
        });
      assert.equal((await listTrash()).page[0].id, expenseId);
      await assert.rejects(() =>
        mutate("billTrash:restoreExpense", {
          groupId: other.groupId,
          expenseId,
        }),
      );
      await mutate("billTrash:restoreExpense", { groupId, expenseId });
      assert.equal((await read()).expenses.length, 1);
      assert.equal((await listTrash()).page.length, 0);
      await mutate("billPayments:undoPayment", { groupId, paymentId });
      assert.equal((await read()).payments.length, 0);
      await mutate("billEdits:updateExpense", {
        groupId,
        expenseId,
        description: "Corrected lunch",
        amountCents: 12000,
        participantIds: [a, b],
      });
      assert.equal((await read()).expenses[0].amountCents, 12000);
      await assert.rejects(() =>
        mutate("billTrash:permanentlyDeleteExpense", { groupId, expenseId }),
      );
      await mutate("bills:deleteExpense", { groupId, expenseId });
      await assert.rejects(() =>
        mutate("billTrash:permanentlyDeleteExpense", {
          groupId: other.groupId,
          expenseId,
        }),
      );
      await mutate("billTrash:permanentlyDeleteExpense", {
        groupId,
        expenseId,
      });
      assert.equal((await listTrash()).page.length, 0);
      await assert.rejects(() =>
        mutate("billEdits:removeMember", { memberId: b }),
      ); // even voided payment history must retain its members
    } finally {
      // Only delete disposable groups created by this test; never use an existing group.
      for (const groupId of groupIds)
        await mutate("bills:deleteGroup", { groupId });
    }
  },
);
