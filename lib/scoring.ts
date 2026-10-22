import type { Store } from "./store";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const DISCORD_EPOCH = 1_420_070_400_000n;

// Epoch 0 starts Monday 2026-10-19 00:00 UTC unless overridden.
export const EPOCH0_MS = Number(process.env.EPOCH0_MS ?? Date.UTC(2026, 9, 19));
export const DAILY_CAP = 5;
export const MIN_ACCOUNT_AGE_DAYS = 30;

export function epochOf(nowMs: number) {
  return Math.max(0, Math.floor((nowMs - EPOCH0_MS) / WEEK_MS));
}

export function dayOf(nowMs: number) {
  return Math.floor(nowMs / DAY_MS);
}

// Discord ids are snowflakes: the top 42 bits are ms since 2015-01-01.
export function discordAccountCreatedMs(userId: string) {
  return Number((BigInt(userId) >> 22n) + DISCORD_EPOCH);
}

// 1, 0.5, 0.25, ... for the nth counted send from one sender to one token in one day.
export function sendWeight(n: number) {
  return n >= 1 && n <= DAILY_CAP ? 1 / 2 ** (n - 1) : 0;
}

export type SendInput = {
  interactionId: string;
  tokenId: number;
  senderId: string;
  nowMs: number;
  // Wallet the sender linked, if any, and the token's current owner. Equal means self-send.
  senderWallet?: string | null;
  tokenOwner?: string | null;
};

export type SendResult =
  | { status: "duplicate" }
  | { status: "counted"; score: number; nth: number }
  | {
      status: "uncredited";
      reason: "new-account" | "self-send" | "daily-cap";
      nth?: number;
    };

export const keys = {
  interaction: (id: string) => `interaction:${id}`,
  perSenderDay: (epoch: number, token: number, sender: string, day: number) =>
    `sends:${epoch}:${token}:${sender}:${day}`,
  leaderboard: (epoch: number | "all") => `lb:${epoch}`,
  raw: (epoch: number | "all", token: number) => `raw:${epoch}:${token}`,
  unique: (epoch: number, token: number) => `uniq:${epoch}:${token}`,
  total: (epoch: number | "all") => `total:${epoch}`,
  senders: (epoch: number | "all") => `senders:${epoch}`,
  daily: (token: number) => `daily:${token}`,
};

export async function recordSend(
  store: Store,
  input: SendInput,
): Promise<SendResult> {
  const { interactionId, tokenId, senderId, nowMs } = input;
  if (!(await store.setNX(keys.interaction(interactionId), "1", 2 * 86_400)))
    return { status: "duplicate" };

  const epoch = epochOf(nowMs);
  const day = dayOf(nowMs);

  // Raw usage counts every send, credited or not. Stats pages show both.
  await Promise.all([
    store.incr(keys.raw(epoch, tokenId)),
    store.incr(keys.raw("all", tokenId)),
    store.incr(keys.total(epoch)),
    store.incr(keys.total("all")),
    store.hincrby(keys.daily(tokenId), String(day), 1),
    store.sadd(keys.senders(epoch), senderId),
    store.sadd(keys.senders("all"), senderId),
  ]);

  if (
    nowMs - discordAccountCreatedMs(senderId) <
    MIN_ACCOUNT_AGE_DAYS * DAY_MS
  ) {
    return { status: "uncredited", reason: "new-account" };
  }
  if (
    input.senderWallet &&
    input.tokenOwner &&
    input.senderWallet.toLowerCase() === input.tokenOwner.toLowerCase()
  ) {
    return { status: "uncredited", reason: "self-send" };
  }

  const nth = await store.incr(
    keys.perSenderDay(epoch, tokenId, senderId, day),
    8 * 86_400,
  );
  const score = sendWeight(nth);
  if (score === 0) return { status: "uncredited", reason: "daily-cap", nth };

  const member = String(tokenId);
  await Promise.all([
    store.zincrby(keys.leaderboard(epoch), score, member),
    store.zincrby(keys.leaderboard("all"), score, member),
    store.sadd(keys.unique(epoch, tokenId), senderId),
  ]);
  return { status: "counted", score, nth };
}
