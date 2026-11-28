import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import process from "node:process";
import { test } from "node:test";

import { ConvexClient } from "convex/browser";

import { api } from "../../../packages/games-convex-backend/convex/_generated/api.js";

const url = process.env.SECRET_SANTA_TEST_CONVEX_URL;

test(
  "a joined participant's profile emoji updates in the owner's roster",
  {
    skip:
      !url && "Set SECRET_SANTA_TEST_CONVEX_URL to a local Convex deployment",
    timeout: 10_000,
  },
  async (t) => {
    const target = new URL(url);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
    const ownerClient = new ConvexClient(target.origin);
    const guestClient = new ConvexClient(target.origin);
    t.after(() => Promise.all([ownerClient.close(), guestClient.close()]));

    const owner = await ownerClient.mutation(api.user.createUser, {
      name: "Host",
    });
    const guest = await guestClient.mutation(api.user.createUser, {
      name: "Guest",
    });
    const args = { userToken: owner.token };
    const { roomCode } = await ownerClient.mutation(api.rooms.createRoom, {
      ...args,
      roomName: "Secret Santa emoji test",
    });
    assert.ok(roomCode);
    const { success } = await guestClient.mutation(api.rooms.joinRoom, {
      roomCode,
      userToken: guest.token,
    });
    assert.equal(success, true);

    const updates = new EventEmitter();
    const nextRoster = () => once(updates, "roster", { signal: t.signal });
    const initial = nextRoster();
    const unsubscribe = ownerClient.onUpdate(
      api.secretSanta.getGameState,
      { ...args, roomCode },
      (state) => updates.emit("roster", state.participants),
      (error) => updates.emit("error", error),
    );
    t.after(unsubscribe);
    const findGuest = (roster) =>
      roster.find((participant) => participant.user_id === guest.userId);
    const [initialRoster] = await initial;
    const initialGuest = findGuest(initialRoster);
    assert.ok(initialGuest);
    assert.equal(initialGuest.emoji, undefined);

    const [[updatedRoster]] = await Promise.all([
      nextRoster(),
      guestClient.mutation(api.user.setProfileEmoji, {
        token: guest.token,
        emoji: "🦊",
      }),
    ]);
    assert.equal(findGuest(updatedRoster)?.emoji, "🦊");
  },
);
