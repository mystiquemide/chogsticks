import assert from "node:assert/strict";
import { test } from "node:test";
import { MemoryStore } from "../lib/store";
import {
  DAILY_CAP,
  discordAccountCreatedMs,
  EPOCH0_MS,
  epochEnd,
  epochOf,
  epochStart,
  keys,
  LAUNCH_CUTOFF_MS,
  recordSend,
  sendWeight,
} from "../lib/scoring";

const NOW = EPOCH0_MS + 3 * 86_400_000 + 3_600_000;
// Snowflake for an account created at a given time.
const userCreatedAt = (ms: number) => String((BigInt(ms) - 1_420_070_400_000n) << 22n);
const OLD_USER = userCreatedAt(NOW - 400 * 86_400_000);
const OLD_USER_2 = userCreatedAt(NOW - 200 * 86_400_000);
const NEW_USER = userCreatedAt(NOW - 5 * 86_400_000);

let seq = 0;
const send = (store: MemoryStore, over: Partial<Parameters<typeof recordSend>[1]> = {}) =>
  recordSend(store, { interactionId: `i${seq++}`, tokenId: 21, senderId: OLD_USER, nowMs: NOW, ...over });

test("snowflake decodes to account creation time", () => {
  const t = NOW - 123_456_789;
  assert.equal(discordAccountCreatedMs(userCreatedAt(t)), t);
  // Discord's documented example id 175928847299117063 was created 2016-04-30T11:18:25.796Z.
  assert.equal(new Date(discordAccountCreatedMs("175928847299117063")).toISOString(), "2016-04-30T11:18:25.796Z");
});

test("weights decay by half and stop after the daily cap", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(sendWeight), [1, 0.5, 0.25, 0.125, 0.0625, 0]);
  assert.equal(DAILY_CAP, 5);
});

test("10 sends from one sender to one token score 1.9375, raw count stays 10", async () => {
  const store = new MemoryStore();
  const results = [];
  for (let i = 0; i < 10; i++) results.push(await send(store));
  assert.equal(results.filter((r) => r.status === "counted").length, 5);
  assert.deepEqual(results[5], { status: "uncredited", reason: "daily-cap", nth: 6 });
  const epoch = epochOf(NOW);
  assert.equal(await store.zscore(keys.leaderboard(epoch), "21"), 1.9375);
  assert.equal(await store.get(keys.raw(epoch, 21)), "10");
  assert.equal(await store.scard(keys.unique(epoch, 21)), 1);
});

test("cap resets the next day", async () => {
  const store = new MemoryStore();
  for (let i = 0; i < 6; i++) await send(store);
  const next = await send(store, { nowMs: NOW + 86_400_000 });
  assert.deepEqual(next, { status: "counted", score: 1, nth: 1 });
});

test("different senders each get full weight", async () => {
  const store = new MemoryStore();
  await send(store);
  const r = await send(store, { senderId: OLD_USER_2 });
  assert.deepEqual(r, { status: "counted", score: 1, nth: 1 });
  assert.equal(await store.scard(keys.unique(epochOf(NOW), 21)), 2);
});

test("accounts younger than 30 days are counted raw but not credited", async () => {
  const store = new MemoryStore();
  assert.deepEqual(await send(store, { senderId: NEW_USER }), { status: "uncredited", reason: "new-account" });
  assert.equal(await store.zscore(keys.leaderboard(epochOf(NOW)), "21"), null);
  assert.equal(await store.get(keys.raw(epochOf(NOW), 21)), "1");
});

test("holder sending their own Chog scores zero, case-insensitive", async () => {
  const store = new MemoryStore();
  const r = await send(store, { senderWallet: "0xAbC0000000000000000000000000000000000001", tokenOwner: "0xabc0000000000000000000000000000000000001" });
  assert.deepEqual(r, { status: "uncredited", reason: "self-send" });
});

test("a replayed interaction id is ignored entirely", async () => {
  const store = new MemoryStore();
  await send(store, { interactionId: "same" });
  assert.deepEqual(await send(store, { interactionId: "same" }), { status: "duplicate" });
  assert.equal(await store.get(keys.raw(epochOf(NOW), 21)), "1");
});

test("leaderboard orders tokens by score", async () => {
  const store = new MemoryStore();
  await send(store, { tokenId: 7 });
  await send(store, { tokenId: 21 });
  await send(store, { tokenId: 21, senderId: OLD_USER_2 });
  const top = await store.ztop(keys.leaderboard(epochOf(NOW)), 10);
  assert.deepEqual(top, [{ member: "21", score: 2 }, { member: "7", score: 1 }]);
});

test("week 1 ends at the launch cutoff, later weeks run 7 days from it", () => {
  assert.equal(epochOf(EPOCH0_MS), 0);
  assert.equal(epochOf(EPOCH0_MS - 1), 0);
  assert.equal(epochOf(LAUNCH_CUTOFF_MS - 1), 0);
  assert.equal(epochOf(LAUNCH_CUTOFF_MS), 1);
  assert.equal(epochOf(LAUNCH_CUTOFF_MS + 7 * 86_400_000 - 1), 1);
  assert.equal(epochOf(LAUNCH_CUTOFF_MS + 7 * 86_400_000), 2);
  assert.equal(epochStart(0), EPOCH0_MS);
  assert.equal(epochEnd(0), LAUNCH_CUTOFF_MS);
  assert.equal(epochStart(1), LAUNCH_CUTOFF_MS);
  assert.equal(epochEnd(1), epochStart(2));
});
