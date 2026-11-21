import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../packages/games-convex-backend/convex/_generated/api.js";

const url = process.env.SCRIBBLE_TEST_CONVEX_URL;

test(
  "guests play, draw, score, rotate, and finish two games",
  {
    skip: !url && "Set SCRIBBLE_TEST_CONVEX_URL to a local Convex deployment",
    timeout: 80_000,
  },
  async (t) => {
    const target = new URL(url);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
    const client = new ConvexHttpClient(target.origin);
    const [host, guesser, lateGuest, outsider] = await Promise.all(
      ["Host", "Guesser", "Late guest", "Outsider"].map((name) =>
        client.mutation(api.user.createUser, { name }),
      ),
    );
    const { roomCode } = await client.mutation(api.rooms.createRoom, {
      roomName: "Scribble integration test",
      userToken: host.token,
      game: "scribble",
    });
    assert.ok(roomCode);

    const args = (guest) => ({ roomCode, userToken: guest.token });
    const enter = (guest) =>
      client.mutation(api.scribbleRooms.enter, args(guest));
    const state = (guest) =>
      client.query(api.scribbleMatch.getState, args(guest));
    const match = async (guest) => (await state(guest)).match;
    const start = (previousMatchId = null) =>
      client.mutation(api.scribbleMatch.start, {
        ...args(host),
        previousMatchId,
      });
    const send = (guest, turnKey, message) =>
      client.mutation(
        api.chat.sendMessage,
        {
          ...args(guest),
          turnKey,
          message,
        },
        { skipQueue: true },
      );
    const readChat = (guest) => client.query(api.chat.getMessages, args(guest));
    const settings = { rounds: 2, timer: 30, list_of_words: ["Tree House"] };
    const setEmoji = (emoji) =>
      client.mutation(api.user.setProfileEmoji, {
        token: guesser.token,
        emoji,
      });
    const emojiOf = (players, guest = guesser) =>
      players.find(({ id }) => id === guest.userId)?.emoji;

    await assert.rejects(client.mutation(api.user.createUser, { name: " " }));
    await enter(host);
    await assert.rejects(start(), /At least two/);
    await enter(guesser);
    await enter(guesser);
    await setEmoji("🦊");
    const lobby = await state(host);
    assert.equal(lobby.members.length, 2);
    assert.equal(emojiOf(lobby.members), "🦊");
    assert.equal(emojiOf(lobby.members, host), undefined);
    await assert.rejects(state(outsider), /Join the room/);
    await assert.rejects(readChat(outsider), /Join the room/);
    await assert.rejects(
      client.mutation(api.scribbleMatch.start, {
        ...args(guesser),
        previousMatchId: null,
      }),
      /Only the host/,
    );
    await assert.rejects(
      client.mutation(api.scribble.updateGameSettings, {
        ...args(host),
        ...settings,
        rounds: 1.5,
      }),
      /whole number/,
    );
    await client.mutation(api.scribble.updateGameSettings, {
      ...args(host),
      ...settings,
    });
    assert.equal(
      await client.query(api.scribble.getGameSettings, args(guesser)),
      null,
    );
    assert.deepEqual(
      await client.query(api.scribble.getGameSettings, args(host)),
      settings,
    );
    const id = await start();
    await assert.rejects(start(), /already in progress/);
    await assert.rejects(
      client.mutation(api.scribble.updateGameSettings, {
        ...args(host),
        ...settings,
      }),
      /between games/,
    );
    await assert.rejects(
      client.mutation(api.scribbleMatch.stop, {
        ...args(guesser),
        id,
      }),
      /Only the host/,
    );

    const first = await match(host);
    assert.equal(first.drawer.id, host.userId);
    assert.equal(first.totalTurns, 4);
    assert.equal(first.prompt, "Tree House");
    assert.equal((await match(guesser)).prompt, null);
    assert.equal(emojiOf(first.scores), "🦊");
    await setEmoji("🐸");
    assert.equal(emojiOf((await match(host)).scores), "🐸");
    await enter(lateGuest);
    assert.equal((await match(lateGuest)).isPlaying, false);
    assert.equal(await send(lateGuest, first.turnKey, "Tree House"), "hidden");
    assert.equal(await send(lateGuest, first.turnKey, "Hi everyone"), "sent");
    assert.equal(await send(host, first.turnKey, "Tree House"), "hidden");
    assert.equal(await send(guesser, "old turn", "Tree House"), "hidden");

    const stroke = {
      id: randomUUID(),
      tool: "pen",
      points: [20, 20, 40, 40],
      strokeWidth: 3,
      strokeColor: "#123456",
    };
    const save = (guest, canvasId, data = stroke) =>
      client.mutation(api.scribble.saveStroke, {
        ...args(guest),
        canvasId,
        stroke: data,
        isComplete: true,
      });
    const readCanvas = (guest, canvasId) =>
      client.query(api.scribble.getStrokes, {
        ...args(guest),
        canvasId,
      });
    const clear = (guest, canvasId) =>
      client.mutation(api.scribble.clearCanvas, {
        ...args(guest),
        canvasId,
      });
    await assert.rejects(save(guesser, first.canvasId), /no longer available/);
    await assert.rejects(clear(guesser, first.canvasId), /no longer available/);
    await assert.rejects(readCanvas(outsider, first.canvasId), /Join the room/);
    await assert.rejects(
      save(host, first.canvasId, { ...stroke, points: [Infinity, 0] }),
      /Invalid/,
    );
    await save(host, first.canvasId);
    assert.equal((await readCanvas(lateGuest, first.canvasId)).length, 1);
    await clear(host, first.canvasId);
    const cleared = await match(host);
    assert.notEqual(cleared.canvasId, first.canvasId);
    assert.equal(cleared.turnKey, first.turnKey);
    await assert.rejects(save(host, first.canvasId), /no longer available/);
    assert.deepEqual(await readCanvas(guesser, cleared.canvasId), []);

    assert.equal(
      await send(guesser, first.turnKey, "  TREE   house  "),
      "correct",
    );
    assert.equal((await match(host)).phase, "reveal");
    const chat = await readChat(guesser);
    assert.deepEqual(
      chat.map(({ message }) => message),
      ["Hi everyone", "Guessed the drawing!"],
    );

    async function waitFor(predicate, limit = 6000) {
      const deadline = Date.now() + limit;
      while (Date.now() < deadline) {
        const current = await match(host);
        if (current && predicate(current)) return current;
        await sleep(125);
      }
      assert.fail("Timed out waiting for the scheduled turn");
    }

    const second = await waitFor(
      (current) => current.turn === 2 && current.phase === "drawing",
    );
    assert.equal(second.drawer.id, guesser.userId);
    assert.notEqual(second.canvasId, cleared.canvasId);

    // Keep these three HTTP clients eligible while the second turn times out.
    const pulse = setInterval(() => {
      void Promise.all(
        [host, guesser, lateGuest].map((guest) =>
          client.mutation(api.scribbleRooms.heartbeat, args(guest)),
        ),
      ).catch(() => {});
    }, 8000);
    t.after(() => clearInterval(pulse));

    const third = await waitFor(
      (current) => current.turn === 3 && current.phase === "drawing",
      39_000,
    );
    assert.equal(third.round, 2);
    assert.equal(third.drawer.id, host.userId);
    await client.mutation(api.scribbleMatch.stop, { ...args(host), id });
    const results = await match(host);
    assert.equal(results.phase, "finished");
    assert.equal(results.scores[0].id, guesser.userId);
    assert.equal(results.scores[0].count, 1);

    await client.mutation(api.scribble.updateGameSettings, {
      ...args(host),
      ...settings,
      rounds: 1,
    });
    const nextId = await start(id);
    const next = await match(lateGuest);
    assert.equal(next.isPlaying, true);
    assert.equal(next.totalTurns, 3);
    await client.mutation(api.scribbleMatch.stop, { ...args(host), id });
    assert.equal((await match(host)).phase, "drawing");

    const guests = [host, guesser, lateGuest];
    for (const [index, drawer] of guests.entries()) {
      const turn = await waitFor(
        (current) => current.turn === index + 1 && current.phase === "drawing",
      );
      assert.equal(turn.id, nextId);
      assert.equal(turn.drawer.id, drawer.userId);
      const [one, two] = guests.filter(
        (guest) => guest.userId !== drawer.userId,
      );
      const answers = await Promise.all([
        send(one, turn.turnKey, "Tree House"),
        send(one, turn.turnKey, "Tree House"),
        send(two, turn.turnKey, "Tree House"),
      ]);
      assert.equal(answers.filter((answer) => answer === "correct").length, 2);
    }
    const final = await waitFor((current) => current.phase === "finished");
    assert.deepEqual(
      final.scores.map((player) => player.count),
      [2, 2, 2],
    );
  },
);
