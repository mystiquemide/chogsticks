"use client";

import { useState } from "react";
import {
  createWalletClient,
  custom,
  formatUnits,
  type EIP1193Provider,
} from "viem";
import { monad } from "viem/chains";
import type { Payout } from "@/lib/holdings";

const poolAbi = [
  {
    type: "function",
    name: "claimMany",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "items",
        type: "tuple[]",
        components: [
          { name: "epoch", type: "uint256" },
          { name: "tokenId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "proof", type: "bytes32[]" },
        ],
      },
    ],
    outputs: [],
  },
] as const;

type State =
  | { s: "idle" }
  | { s: "working"; msg: string }
  | { s: "done"; tx: string }
  | { s: "error"; msg: string };

export function ClaimAllButton({
  pool,
  wallet,
  payouts,
}: {
  pool: `0x${string}`;
  wallet: string;
  payouts: Payout[];
}) {
  const [state, setState] = useState<State>({ s: "idle" });
  const total = payouts.reduce((sum, p) => sum + BigInt(p.amount), 0n);
  const pretty = Number(formatUnits(total, 18)).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });

  async function claim() {
    const eth = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
    if (!eth)
      return setState({
        s: "error",
        msg: "No wallet found. Open this page in a browser with a wallet.",
      });
    try {
      setState({ s: "working", msg: "Connect your wallet" });
      const client = createWalletClient({
        chain: monad,
        transport: custom(eth),
      });
      const [account] = await client.requestAddresses();
      if (account.toLowerCase() !== wallet.toLowerCase())
        return setState({
          s: "error",
          msg: "Switch to the wallet shown above. Only the holder can claim.",
        });
      setState({ s: "working", msg: "Switching to Monad" });
      await client.switchChain({ id: monad.id }).catch(async () => {
        await client.addChain({ chain: monad });
        await client.switchChain({ id: monad.id });
      });
      setState({ s: "working", msg: "Confirm in your wallet" });
      const tx = await client.writeContract({
        account,
        address: pool,
        abi: poolAbi,
        functionName: "claimMany",
        args: [
          payouts.map((p) => ({
            epoch: BigInt(p.epoch),
            tokenId: BigInt(p.tokenId),
            amount: BigInt(p.amount),
            proof: p.proof,
          })),
        ],
      });
      setState({ s: "done", tx });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setState({
        s: "error",
        msg: /rejected|denied/i.test(raw)
          ? "You cancelled the transaction. Nothing was sent."
          : /insufficient funds/i.test(raw)
            ? "Not enough MON for gas. Add a little MON and try again."
            : "The claim didn't go through. Try again in a minute.",
      });
    }
  }

  if (state.s === "done")
    return (
      <p className="font-mono text-sm">
        Claimed {pretty} $CHOG.{" "}
        <a
          href={`https://monadscan.com/tx/${state.tx}`}
          className="font-bold text-green underline"
        >
          View transaction
        </a>
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={claim}
        disabled={state.s === "working"}
        className="ink-border press self-start rounded-full bg-green px-5 py-2 font-display text-lg uppercase text-white shadow-hard disabled:opacity-60"
      >
        {state.s === "working" ? state.msg : `Claim all ${pretty} $CHOG`}
      </button>
      {state.s === "error" && (
        <p className="font-mono text-sm text-chog-pink">{state.msg}</p>
      )}
    </div>
  );
}
