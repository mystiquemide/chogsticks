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
