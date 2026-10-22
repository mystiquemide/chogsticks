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
