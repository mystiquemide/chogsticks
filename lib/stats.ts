import { epochOf, keys } from "./scoring";
import { getStore } from "./store";

export async function overview() {
  const store = getStore();
  const [sends, people, chogs] = await Promise.all([
    store.get(keys.total("all")),
    store.scard(keys.senders("all")),
    store.zcard(keys.leaderboard("all")),
  ]);
  return { sends: Number(sends ?? 0), people, chogs, epoch: epochOf(Date.now()) };
}
