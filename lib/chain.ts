import { createPublicClient, http } from "viem";
import { monad } from "viem/chains";

export { monad };

export const CHOG_NFT = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763" as const;
export const CHOG_TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777" as const;
export const CHOG_SUPPLY = 1969;

export const erc721Abi = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const publicClient = createPublicClient({
  chain: monad,
  transport: http(process.env.MONAD_RPC_URL || "https://rpc.monad.xyz", {
    batch: true,
  }),
});
