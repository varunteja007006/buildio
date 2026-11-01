import assert from "node:assert/strict";
import test from "node:test";

import { billExpiresAt, purgeBillRecordsBatch } from "../../../packages/games-convex-backend/convex/lib/billRetention.ts";
import { renderGroupArchive } from "../lib/group-archive.ts";
import { forgetGroup, readRecentGroups, rememberGroup } from "../lib/recent-groups.ts";

test("recent bills stay capped, newest first, update names, and forget locally", (t) => {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } };
  t.after(() => delete globalThis.window);
  for (let i = 0; i < 60; i++)
    rememberGroup({ groupId: `bill${i}`, name: `Trip ${i}` });
  let groups = readRecentGroups();
  assert.equal(groups.length, 50); // capped
  assert.deepEqual(groups[0], { groupId: "bill59", name: "Trip 59" }); // newest first
  assert.deepEqual(groups.at(-1), { groupId: "bill10", name: "Trip 10" });
  assert.ok(groups.every((group) => !("visitedAt" in group || "expiresAt" in group)));
  rememberGroup({ groupId: "bill20", name: "Renamed trip" });
  groups = readRecentGroups();
  assert.equal(groups.length, 50); // revisiting moves it to the front, not duplicates
  assert.deepEqual(groups[0], { groupId: "bill20", name: "Renamed trip" });
  assert.equal(groups.filter((group) => group.groupId === "bill20").length, 1);
  forgetGroup("bill20");
  assert.equal(readRecentGroups().length, 49);
  assert.ok(readRecentGroups().every((group) => group.groupId !== "bill20"));
});

test("legacy entries keep their array order, lose extra fields, and dedupe to the first occurrence", (t) => {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } };
  t.after(() => delete globalThis.window);
  values.set("billezy.recent-groups.v1", JSON.stringify([
    // Old entries carry visitedAt/expiresAt; the read ignores them instead of sorting.
    { groupId: "bill1", name: "Old trip", visitedAt: 10, expiresAt: 20 },
    { groupId: "bill2", name: "Older trip", visitedAt: 20, expiresAt: 10 },
    { groupId: "bill1", name: "Duplicate trip", visitedAt: 99, expiresAt: 1 },
  ]));
  assert.deepEqual(readRecentGroups(), [
    { groupId: "bill1", name: "Old trip" }, // first occurrence wins, extra fields stripped
    { groupId: "bill2", name: "Older trip" }, // stays second: recency is array position
  ]);
  rememberGroup({ groupId: "bill3", name: "New trip" });
  assert.deepEqual(JSON.parse(values.get("billezy.recent-groups.v1")), [
    { groupId: "bill3", name: "New trip" },
    { groupId: "bill1", name: "Old trip" },
    { groupId: "bill2", name: "Older trip" },
  ]); // the next write slims the stored legacy entries
});

test("corrupt, unsafe, and blocked browser storage never breaks bills", (t) => {
  let raw = "not json";
  globalThis.window = { localStorage: {
    getItem: () => raw,
    setItem: () => { throw new Error("Quota exceeded"); },
  } };
  t.after(() => delete globalThis.window);
  assert.deepEqual(readRecentGroups(), []);
  raw = JSON.stringify([
    null, 5, "no", [], { no: "ids" },
    { groupId: "../../bad", name: "Bad" },
    { groupId: "bill0" }, { groupId: "bill1", name: 7 },
    { groupId: "bill1", name: "Trip", visitedAt: 999, expiresAt: 1 },
  ]);
  assert.deepEqual(readRecentGroups(), [{ groupId: "bill1", name: "Trip" }]);
  raw = '{"not":"an array"}';
  assert.deepEqual(readRecentGroups(), []);
  raw = JSON.stringify([{ groupId: "bill1", name: "Trip" }]);
  assert.doesNotThrow(() => rememberGroup({ groupId: "bill2", name: "Trip 2" }));
  assert.deepEqual(readRecentGroups(), [{ groupId: "bill1", name: "Trip" }]); // failed writes keep stored entries
  Object.defineProperty(globalThis.window, "localStorage", { get() { throw new Error("Blocked"); } });
  assert.deepEqual(readRecentGroups(), []);
  assert.doesNotThrow(() => rememberGroup({ groupId: "bill1", name: "Trip" }));
  assert.doesNotThrow(() => forgetGroup("bill1"));
});

test("retention uses six calendar months with UTC month-end and leap-year clamping", () => {
  for (const [created, expires] of [
    ["2026-01-15T12:34:56.789Z", "2026-07-15T12:34:56.789Z"],
    ["2026-08-31T12:34:56.789Z", "2027-02-28T12:34:56.789Z"],
    ["2023-08-31T00:00:00.000Z", "2024-02-29T00:00:00.000Z"],
    ["2024-02-29T00:00:00.000Z", "2024-08-29T00:00:00.000Z"],
    ["2026-12-31T00:00:00.000Z", "2027-06-30T00:00:00.000Z"],
  ]) {
    const deadline = billExpiresAt(Date.parse(created));
    assert.equal(new Date(deadline).toISOString(), expires);
    assert.ok(deadline - Date.parse(created) > 180 * 86400000);
  }
});

test("cleanup batches include trash and undone payments, leave other groups alone, and are retry-safe", async () => {
  const tables = Object.fromEntries([
    ["bill_expenses", 205], ["bill_payments", 110], ["bill_members", 50],
  ].map(([table, count]) => [table, [
    ...Array.from({ length: count }, (_, i) => ({
      _id: `${table}${i}`, groupId: "target", deleted_at: i, voided_at: i,
    })),
    { _id: `${table}-other`, groupId: "other" },
  ]]));
  let deleted = 0;
  const ctx = { db: {
    query: (table) => ({ withIndex: (index, range) => {
      assert.equal(index, "by_group");
      let groupId;
      range({ eq: (field, value) => { assert.equal(field, "groupId"); groupId = value; } });
      return { take: async (count) => {
        assert.ok(count > 0 && count <= 100);
        return tables[table].filter((row) => row.groupId === groupId).slice(0, count);
      } };
    } }),
    delete: async (id) => {
      for (const rows of Object.values(tables)) {
        const index = rows.findIndex((row) => row._id === id);
        if (index !== -1) { rows.splice(index, 1); deleted++; return; }
      }
      assert.fail(`Unexpected deletion: ${id}`);
    },
  } };
  let done = false;
  let rounds = 0;
  while (!done) {
    const before = deleted;
    done = await purgeBillRecordsBatch(ctx, "target");
    assert.ok(deleted - before <= 100);
    assert.ok(++rounds < 10);
  }
  assert.equal(deleted, 365);
  for (const rows of Object.values(tables)) {
    assert.equal(rows.length, 1);
    assert.equal(rows[0].groupId, "other");
  }
  assert.equal(await purgeBillRecordsBatch(ctx, "target"), true);
  assert.equal(deleted, 365);
});

test("offline HTML escapes user content and preserves every record and exact cent value", () => {
  const name = '</pre><script>alert("unsafe")</script>&';
  const data = {
    group: { _id: "group1", _creationTime: 1, name, currency: "₹", created_at: 1 },
    members: [{ _id: "member1", _creationTime: 1, groupId: "group1", name: '<img src=x onerror="alert(1)">', created_at: 1 }],
    expenses: [{ _id: "expense1", _creationTime: 1, groupId: "group1", description: name, amount_cents: 9007199254740991, payer_id: "member1", participant_ids: ["member1"], created_at: 1, deleted_at: 2 }],
    payments: [{ _id: "payment1", _creationTime: 1, groupId: "group1", from_id: "member1", to_id: "member1", amount_cents: 123, created_at: 1, voided_at: 3 }],
    expiresAt: 100000,
  };
  const html = renderGroupArchive(data, 2000);
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes("default-src 'none'"));
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img "));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Deleted 1970-01-01T00:00:00.002Z"));
  assert.ok(html.includes("Undone 1970-01-01T00:00:00.003Z"));
  const entities = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&amp;": "&" };
  const raw = html.match(/<pre>([\s\S]*?)<\/pre>/)[1].replace(/&(?:lt|gt|quot|#39|amp);/g, (entity) => entities[entity]);
  assert.deepEqual(JSON.parse(raw), { ...data, exportedAt: 2000 });
});

const baseGroup = { _id: "group1", _creationTime: 1, groupId: "group1", currency: "₹", created_at: 1 };
const member = (id, name) => ({ _id: id, _creationTime: 1, groupId: "group1", name, created_at: 1 });
const expense = (id, amount, payer, extra = {}) => ({
  _id: id, _creationTime: 1, groupId: "group1", description: `Expense ${id}`, amount_cents: amount,
  payer_id: payer, participant_ids: ["memberA", "memberB"], created_at: 1, ...extra,
});
const payment = (id, amount, extra = {}) => ({
  _id: id, _creationTime: 1, groupId: "group1", from_id: "memberB", to_id: "memberA",
  amount_cents: amount, created_at: 1, ...extra,
});
const summaryData = (expenses, payments) => ({
  group: baseGroup,
  members: [member("memberA", "Asha"), member("memberB", "Bilal")],
  expenses, payments, expiresAt: 100000,
});
const jsonDump = (html) => JSON.parse(
  html.match(/<pre>([\s\S]*?)<\/pre>/)[1]
    .replace(/&(?:lt|gt|quot|#39|amp);/g, (e) => ({ "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&amp;": "&" })[e]),
);

test("financial summary counts only active records and shows remaining transfers", () => {
  const html = renderGroupArchive(summaryData(
    [expense("expense1", 30000, "memberA"), expense("expense2", 20000, "memberA", { deleted_at: 9 })],
    [payment("payment1", 5000), payment("payment2", 1000, { voided_at: 9 })],
  ), 2000);
  assert.ok(html.includes("Total active expenses: ₹300.00"));
  // Asha: paid 300 − share 150 − received 50 = still receives 100; Bilal still owes 100.
  assert.ok(html.includes("Still receives ₹100.00"));
  assert.ok(html.includes("Still owes ₹100.00"));
  assert.ok(!html.includes("Still owes ₹200.00")); // the deleted expense must not count
  assert.ok(html.includes("<h3>Remaining settlement transfers</h3>"));
  assert.ok(html.includes("<td>₹100.00</td>"));
  assert.ok(html.includes("Deleted 1970-01-01T00:00:00.009Z"));
  assert.ok(html.includes("Undone 1970-01-01T00:00:00.009Z"));
  assert.equal(jsonDump(html).expenses.length, 2);
  assert.equal(jsonDump(html).payments.length, 2);
});

test("fully settled groups show no remaining transfers", () => {
  const html = renderGroupArchive(summaryData(
    [expense("expense1", 10000, "memberA", { participant_ids: ["memberA"] })],
    [],
  ), 2000);
  // Asha paid for herself only: every balance is zero.
  assert.ok(html.includes("Settled"));
  assert.ok(html.includes("All active balances are settled"));
  assert.ok(!html.includes("<h3>Remaining settlement transfers</h3>"));
});

test("a malformed legacy record keeps the raw export but marks the summary unavailable", () => {
  const html = renderGroupArchive(summaryData([expense("expense1", 30000, "ghost")], []), 2000);
  assert.ok(html.includes("Financial summary is unavailable"));
  assert.ok(html.includes("Unknown member (ghost)"));
  assert.ok(html.includes("<h2>All expenses</h2>"));
  assert.ok(html.includes("<h2>Members</h2>"));
  assert.equal(jsonDump(html).expenses[0].payer_id, "ghost");
  assert.equal(jsonDump(html).members.length, 2);
});
