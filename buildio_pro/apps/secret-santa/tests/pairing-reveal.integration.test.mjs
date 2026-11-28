import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../packages/games-convex-backend/convex/_generated/api.js";

const url = process.env.SECRET_SANTA_TEST_CONVEX_URL;

test(
  "only unanimous consent for the current draw and host reveals pairings",
  {
    skip:
      !url && "Set SECRET_SANTA_TEST_CONVEX_URL to a local Convex deployment",
    timeout: 10_000,
  },
  async () => {
    const target = new URL(url);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
    const client = new ConvexHttpClient(target.origin);
    const [host, guest, third, lateGuest] = await Promise.all(
      ["Host", "Guest", "Third", "Late guest"].map((name) =>
        client.mutation(api.user.createUser, { name }),
      ),
    );
    const { roomCode } = await client.mutation(api.rooms.createRoom, {
      userToken: host.token,
      roomName: "Secret Santa pairing reveal test",
    });
    assert.ok(roomCode);

    const args = (user) => ({ roomCode, userToken: user.token });
    const state = (user) =>
      client.query(api.secretSanta.getGameState, args(user));
    const join = (user) => client.mutation(api.rooms.joinRoom, args(user));
    const draw = () => client.mutation(api.secretSanta.runDraw, args(host));
    const setConsent = (user, { assignmentId, version }, approved = true) =>
      client.mutation(api.secretSanta.setRevealConsent, {
        ...args(user),
        assignmentId,
        version,
        approved,
      });
    const transfer = (from, to) =>
      client.mutation(api.secretSanta.transferHost, {
        ...args(from),
        targetUserId: to.userId,
      });

    await client.mutation(api.secretSanta.initializeGame, args(host));
    assert.equal((await state(host)).reveal, undefined);
    assert.equal((await join(guest)).success, true);
    assert.equal((await join(third)).success, true);
    assert.equal((await draw()).success, true);
    const players = [host, guest, third];
    const before = await Promise.all(players.map(state));
    const [hostVote, guestVote, thirdVote] = before.map(({ reveal }) => reveal);
    assert.equal(hostVote.approvedCount, 0);
    assert.equal(hostVote.pairings, undefined);

    await assert.rejects(setConsent(guest, thirdVote), /your current draw/);
    await assert.rejects(setConsent(lateGuest, guestVote), /not a member/);
    await setConsent(guest, guestVote);
    await setConsent(third, thirdVote);
    assert.equal((await state(host)).reveal.approvedCount, 2);
    assert.equal((await state(host)).reveal.pairings, undefined);
    await setConsent(host, hostVote);

    const expected = new Map(
      players.map(({ userId }, i) => [userId, before[i].my_recipient.user_id]),
    );
    assert.deepEqual(
      new Map(
        (await state(host)).reveal.pairings.map(({ santaId, recipientId }) => [
          santaId,
          recipientId,
        ]),
      ),
      expected,
    );
    assert.equal((await state(guest)).reveal.pairings, undefined);
    assert.equal((await state(lateGuest)).reveal, undefined);
    await setConsent(third, thirdVote, false);
    assert.equal((await state(host)).reveal.pairings, undefined);
    await setConsent(third, thirdVote);

    await transfer(host, guest);
    assert.equal((await state(guest)).reveal.approvedCount, 0);
    assert.equal((await state(guest)).reveal.pairings, undefined);
    assert.equal((await state(host)).reveal.pairings, undefined);
    await assert.rejects(setConsent(third, thirdVote), /your current draw/);
    await transfer(guest, host);
    assert.equal((await state(host)).reveal.approvedCount, 0);
    const votes = await Promise.all(
      players.map(async (user) => (await state(user)).reveal),
    );
    for (const [i, user] of players.entries()) {
      await setConsent(user, votes[i]);
    }
    assert.equal((await state(host)).reveal.pairings.length, 3);

    assert.equal((await join(lateGuest)).success, true);
    const joined = (await state(host)).reveal;
    assert.equal(joined.participantCount, 4);
    assert.equal(joined.allMatched, false);
    assert.equal(joined.pairings, undefined);
    assert.equal((await draw()).success, true);
    await assert.rejects(setConsent(host, votes[0]), /your current draw/);
    const redrawn = (await state(host)).reveal;
    assert.equal(redrawn.allMatched, true);
    assert.equal(redrawn.approvedCount, 0);
    assert.equal(redrawn.pairings, undefined);
  },
);
