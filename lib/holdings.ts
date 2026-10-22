import { getAddress, isAddress } from "viem";
import { CHOG_NFT, CHOG_SUPPLY, erc721Abi, publicClient } from "./chain";
import { readEpoch } from "./epochs";
import { POOL_ADDRESS, poolUnallocated } from "./pool";
import { keys } from "./scoring";
import { currentEpoch } from "./stats";
import { getStore } from "./store";

const claimedAbi = [
  {
    type: "function",
    name: "claimed",
    stateMutability: "view",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export type Payout = {
  epoch: number;
  tokenId: number;
  amount: string;
  proof: `0x${string}`[];
};

export type Holding = {
  id: number;
  weekSends: number;
  allSends: number;
  rank: number | null;
  estimate: number;
  unclaimed: Payout[];
};

// Chog Genesis is not enumerable, so ownership comes from one multicall over every token.
export async function chogsOf(wallet: string) {
  const owner = getAddress(wallet);
  const results = await publicClient.multicall({
    allowFailure: true,
    batchSize: 40_000,
    contracts: Array.from({ length: CHOG_SUPPLY }, (_, i) => ({
      address: CHOG_NFT,
      abi: erc721Abi,
      functionName: "ownerOf" as const,
      args: [BigInt(i + 1)] as const,
    })),
  });
  return results.flatMap((r, i) =>
    r.status === "success" && r.result === owner ? [i + 1] : [],
  );
}

export async function holdingsOf(wallet: string): Promise<Holding[]> {
  if (!isAddress(wallet)) return [];
  const ids = await chogsOf(wallet);
  if (ids.length === 0) return [];

  const store = getStore();
  const epoch = currentEpoch();
  const [board, unallocated, weekRaw, allRaw] = await Promise.all([
    store.ztop(keys.leaderboard(epoch), 2000),
    poolUnallocated().catch(() => 0),
    Promise.all(ids.map((id) => store.get(keys.raw(epoch, id)))),
    Promise.all(ids.map((id) => store.get(keys.raw("all", id)))),
  ]);
  const total = board.reduce((sum, b) => sum + b.score, 0);

  // Every posted week this wallet's Chogs have a row in, minus what is already claimed.
  const owed: Payout[] = [];
  for (let e = 0; e <= epoch; e++) {
    const file = readEpoch(e);
    for (const row of file?.rows ?? [])
      if (ids.includes(row.tokenId))
        owed.push({
          epoch: e,
          tokenId: row.tokenId,
          amount: row.amount,
          proof: row.proof,
        });
  }
  const claimed = owed.length
    ? await publicClient.multicall({
        allowFailure: true,
        contracts: owed.map((p) => ({
          address: POOL_ADDRESS,
          abi: claimedAbi,
          functionName: "claimed" as const,
          args: [BigInt(p.epoch), BigInt(p.tokenId)] as const,
        })),
      })
    : [];
  const unclaimed = owed.filter(
    (_, i) => !(claimed[i]?.status === "success" && claimed[i].result),
  );

  return ids
    .map((id, i) => {
      const idx = board.findIndex((b) => b.member === String(id));
      const score = idx >= 0 ? board[idx].score : 0;
      return {
        id,
        weekSends: Number(weekRaw[i] ?? 0),
        allSends: Number(allRaw[i] ?? 0),
        rank: idx >= 0 ? idx + 1 : null,
        estimate: total > 0 ? (score / total) * unallocated : 0,
        unclaimed: unclaimed.filter((p) => p.tokenId === id),
      };
    })
    .sort((a, b) => b.weekSends - a.weekSends || a.id - b.id);
}
