import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../packages/games-convex-backend/convex/_generated/api.js";

const url = process.env.SECRET_SANTA_TEST_CONVEX_URL;

test(
  "only the Secret Santa host can transfer controls, even after the draw",
  {
    skip:
      !url && "Set SECRET_SANTA_TEST_CONVEX_URL to a local Convex deployment",
    timeout: 10_000,
  },
  async () => {
    const target = new URL(url);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
    const client = new ConvexHttpClient(target.origin);
    const [owner, guest, third, outsider] = await Promise.all(
      ["Owner", "Guest", "Third", "Outsider"].map((name) =>
        client.mutation(api.user.createUser, { name }),
      ),
    );
    const { roomCode } = await client.mutation(api.rooms.createRoom, {
      userToken: owner.token,
      roomName: "Secret Santa host transfer test",
    });
    assert.ok(roomCode);

    const args = (user) => ({ roomCode, userToken: user.token });
    const state = (user) =>
      client.query(api.secretSanta.getGameState, args(user));
    const transfer = (from, to) =>
      client.mutation(api.secretSanta.transferHost, {
        ...args(from),
        targetUserId: to.userId,
      });
    const draw = (user) => client.mutation(api.secretSanta.runDraw, args(user));
    const reset = (user) =>
      client.mutation(api.secretSanta.resetDraw, args(user));
    const budget = (user) =>
      client.mutation(api.secretSanta.setBudget, {
        ...args(user),
        minBudget: 10,
        maxBudget: 30,
      });
    const kick = (from, to) =>
      client.mutation(api.secretSanta.kickParticipant, {
        ...args(from),
        targetUserId: to.userId,
      });

    await client.mutation(api.secretSanta.initializeGame, args(owner));
    for (const user of [guest, third]) {
      const joined = await client.mutation(api.rooms.joinRoom, args(user));
      assert.equal(joined.success, true);
    }
    assert.equal((await state(guest)).room.hostId, owner.userId);
    await assert.rejects(transfer(guest, third), /Only the host/);
    await assert.rejects(transfer(owner, outsider), /Choose a participant/);

    await transfer(owner, guest);
    await assert.rejects(draw(owner), /Only the host/);
    assert.equal((await draw(guest)).success, true);
    await budget(guest);
    const players = [owner, guest, third];
    const before = await Promise.all(players.map(state));
    assert.equal(
      new Set(before.map(({ my_recipient }) => my_recipient.user_id)).size,
      players.length,
    );

    await transfer(guest, third);
    const after = await Promise.all(players.map(state));
    for (const [i, snapshot] of after.entries()) {
      assert.deepEqual(snapshot, {
        ...before[i],
        room: { ...before[i].room, hostId: third.userId },
        reveal: { ...before[i].reveal, version: before[i].reveal.version + 1 },
      });
    }
    assert.equal(after[2].room.ownerId, owner.userId);
    await assert.rejects(transfer(guest, owner), /Only the host/);
    await assert.rejects(reset(guest), /Only the host/);
    await assert.rejects(budget(guest), /Only the host/);
    await assert.rejects(kick(guest, owner), /Only the host/);
    await assert.rejects(kick(third, third), /host can't be kicked/);
    await assert.rejects(kick(third, owner), /room owner can't be kicked/);
    await reset(third);
    assert.equal((await state(third)).status, "lobby");
    assert.equal((await kick(third, guest)).kicked, true);
    await transfer(third, owner);
    assert.equal((await state(owner)).room.hostId, owner.userId);
  },
);
