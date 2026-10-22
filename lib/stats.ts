import { epochOf, keys } from "./scoring";
import { getStore } from "./store";

export async function overview() {
  const store = getStore();
  const [sends, people, chogs] = await Promise.all([
    store.get(keys.total("all")),
    store.scard(keys.senders("all")),
    store.zcard(keys.leaderboard("all")),
  ]);
  return {
    sends: Number(sends ?? 0),
    people,
    chogs,
    epoch: epochOf(Date.now()),
  };
}

export type RankedChog = {
  id: number;
  score: number;
  sends: number;
  people: number;
};

export async function topChogs(
  epoch: number | "all",
  count: number,
): Promise<RankedChog[]> {
  const store = getStore();
  const top = await store.ztop(keys.leaderboard(epoch), count);
  return Promise.all(
    top.map(async ({ member, score }) => {
      const id = Number(member);
      const [sends, people] = await Promise.all([
        store.get(keys.raw(epoch, id)),
        epoch === "all"
          ? Promise.resolve(0)
          : store.scard(keys.unique(epoch, id)),
      ]);
      return { id, score, sends: Number(sends ?? 0), people };
    }),
  );
}

export function currentEpoch() {
  return epochOf(Date.now());
}

const DAY_MS = 86_400_000;

export async function tokenStats(id: number) {
  const store = getStore();
  const epoch = currentEpoch();
  const [weekSends, allSends, people, score, board, daily] = await Promise.all([
    store.get(keys.raw(epoch, id)),
    store.get(keys.raw("all", id)),
    store.scard(keys.unique(epoch, id)),
    store.zscore(keys.leaderboard(epoch), String(id)),
    store.ztop(keys.leaderboard(epoch), 2000),
    store.hgetall(keys.daily(id)),
  ]);
  const rankIdx = board.findIndex((b) => b.member === String(id));
  const totalScore = board.reduce((sum, b) => sum + b.score, 0);
  const today = Math.floor(Date.now() / DAY_MS);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = today - 6 + i;
    return { day, sends: daily[String(day)] ?? 0 };
  });
  return {
    epoch,
    weekSends: Number(weekSends ?? 0),
    allSends: Number(allSends ?? 0),
    people,
    score: score ?? 0,
    rank: rankIdx >= 0 ? rankIdx + 1 : null,
    share: totalScore > 0 && score ? score / totalScore : 0,
    last7,
  };
}
