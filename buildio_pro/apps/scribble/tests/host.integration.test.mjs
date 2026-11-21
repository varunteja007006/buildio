import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../packages/games-convex-backend/convex/_generated/api.js";

const url = process.env.SCRIBBLE_TEST_CONVEX_URL;

test(
  "Scribble transfers gameplay controls while preserving shared room ownership",
  {
    skip: !url && "Set SCRIBBLE_TEST_CONVEX_URL to a local Convex deployment",
    timeout: 70_000,
  },
  async () => {
    const target = new URL(url);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
    const client = new ConvexHttpClient(target.origin);
    const [owner, oldestGuest, anotherGuest, outsider] = await Promise.all(
      ["Owner", "First guest", "Another guest", "Outsider"].map((name) =>
        client.mutation(api.user.createUser, { name }),
      ),
    );

    const regularRoom = await client.mutation(api.rooms.createRoom, {
      roomName: "Shared room",
      userToken: owner.token,
    });
    const getDetails = (roomCode) =>
      client.query(api.rooms.getRoomDetails, {
        roomCode,
        userToken: owner.token,
      });
    assert.equal(
      (await getDetails(regularRoom.roomCode)).room.ownerId,
      owner.userId,
    );
    await assert.rejects(
      client.mutation(api.scribbleRooms.enter, {
        roomCode: regularRoom.roomCode,
        userToken: owner.token,
      }),
      /Scribble room not found/,
    );

    const { roomCode } = await client.mutation(api.rooms.createRoom, {
      roomName: "Scribble host handoff",
      userToken: owner.token,
      game: "scribble",
    });
    const args = (actor) => ({ roomCode, userToken: actor.token });
    const enter = (actor) =>
      client.mutation(api.scribbleRooms.enter, args(actor));
    const state = (actor) =>
      client.query(api.scribbleMatch.getState, args(actor));
    const transfer = (from, to) =>
      client.mutation(api.scribbleRooms.transferHost, {
        ...args(from),
        targetUserId: to.userId,
      });
    const settings = (actor) =>
      client.mutation(api.scribble.updateGameSettings, {
        ...args(actor),
        rounds: 1,
        timer: 30,
        list_of_words: ["Star"],
      });
    const start = (actor) =>
      client.mutation(api.scribbleMatch.start, {
        ...args(actor),
        previousMatchId: null,
      });

    await enter(owner);
    await enter(oldestGuest);
    await enter(anotherGuest);
    assert.equal((await state(oldestGuest)).hostId, owner.userId);
    await assert.rejects(transfer(oldestGuest, outsider), /Only the host/);
    await assert.rejects(transfer(owner, outsider), /online in this room/);
    await transfer(owner, anotherGuest);
    const afterTransfer = await state(anotherGuest);
    assert.equal(afterTransfer.isHost, true);
    assert.equal(afterTransfer.ownerId, owner.userId);
    assert.equal(afterTransfer.hostName, "Another guest");
    assert.equal((await getDetails(roomCode)).room.ownerId, owner.userId);
    await assert.rejects(start(owner), /Only the host/);
    await assert.rejects(settings(owner), /Only the host/);
    await settings(anotherGuest);
    const id = await start(anotherGuest);
    await assert.rejects(
      client.mutation(api.scribbleMatch.stop, { ...args(owner), id }),
      /Only the host/,
    );
    await client.mutation(api.scribbleMatch.stop, {
      ...args(anotherGuest),
      id,
    });
    await transfer(anotherGuest, owner);

    const firstSeenAt = (await state(owner)).members.find(
      ({ id }) => id === owner.userId,
    ).seenAt;
    const deadline = firstSeenAt + 60_000;
    let current;
    do {
      // Let both contenders remain online while the host's heartbeat expires.
      for (const guest of [anotherGuest, oldestGuest]) {
        await client.mutation(api.scribbleRooms.heartbeat, args(guest));
      }
      current = await state(oldestGuest);
      if (current.isHost) break;
      await sleep(6_000);
    } while (Date.now() < deadline);

    assert.ok(Date.now() - firstSeenAt >= 45_000);
    assert.equal(current.hostId, oldestGuest.userId);
    assert.equal(current.ownerId, owner.userId);
    await enter(owner);
    assert.equal((await state(owner)).isHost, false);
    assert.equal((await state(owner)).hostId, oldestGuest.userId);
  },
);
