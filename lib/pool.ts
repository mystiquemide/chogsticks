import { formatUnits } from "viem";
import { CHOG_TOKEN, publicClient } from "./chain";

export const POOL_ADDRESS = (process.env.NEXT_PUBLIC_POOL_ADDRESS ??
  "0x430dAd64ADF435D9aD6AbCc42340483ec4ad3d04") as `0x${string}`;

const poolAbi = [
  {
    type: "function",
    name: "unallocated",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allocated",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "poster",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "roots",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "epochRemaining",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimed",
    stateMutability: "view",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;
const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export async function poolBalances() {
  const [balance, allocated] = await Promise.all([
    publicClient.readContract({
      address: CHOG_TOKEN,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [POOL_ADDRESS],
    }),
    publicClient.readContract({
      address: POOL_ADDRESS,
      abi: poolAbi,
      functionName: "allocated",
    }),
  ]);
  return {
    balance: Number(formatUnits(balance, 18)),
    allocated: Number(formatUnits(allocated, 18)),
  };
}

const ownerAbi = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

export async function ownerOf(id: number) {
  const { CHOG_NFT } = await import("./chain");
  return publicClient.readContract({
    address: CHOG_NFT,
    abi: ownerAbi,
    functionName: "ownerOf",
    args: [BigInt(id)],
  });
}

export async function poolUnallocated() {
  const { balance, allocated } = await poolBalances();
  return balance - allocated;
}

export async function epochRoots(upTo: number) {
  const epochs = Array.from({ length: upTo + 1 }, (_, i) => i);
  return Promise.all(
    epochs.map(async (e) => {
      const [root, remaining] = await Promise.all([
        publicClient.readContract({
          address: POOL_ADDRESS,
          abi: poolAbi,
          functionName: "roots",
          args: [BigInt(e)],
        }),
        publicClient.readContract({
          address: POOL_ADDRESS,
          abi: poolAbi,
          functionName: "epochRemaining",
          args: [BigInt(e)],
        }),
      ]);
      const posted =
        root !==
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      return {
        epoch: e,
        posted,
        root,
        remaining: Number(formatUnits(remaining, 18)),
      };
    }),
  );
}

export async function poster() {
  return publicClient.readContract({
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: "poster",
  });
}

export async function isClaimed(epoch: number, tokenId: number) {
  return publicClient.readContract({
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: "claimed",
    args: [BigInt(epoch), BigInt(tokenId)],
  });
}

// Each week pays out half of what the pool has not yet promised, so the pool never runs dry.
export const WEEK_BUDGET_SHARE = 0.5;

export async function weekBudget() {
  return (await poolUnallocated()) * WEEK_BUDGET_SHARE;
}
