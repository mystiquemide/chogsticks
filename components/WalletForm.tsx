"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EIP1193Provider } from "viem";

export function WalletForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [note, setNote] = useState("");

  const go = (w: string) => router.push(`/my?wallet=${w.trim()}`);

  async function useConnected() {
    const eth = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
    if (!eth) return setNote("No wallet found. Paste an address instead.");
    try {
      const [account] = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[];
      setValue(account);
      go(account);
    } catch {
      setNote("Wallet connection cancelled. Paste an address instead.");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className="flex flex-col gap-3"
    >
      <label
        htmlFor="wallet"
        className="font-display text-sm uppercase text-muted"
      >
        Wallet address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="wallet"
          name="wallet"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          autoComplete="off"
          className="ink-border min-w-0 flex-1 rounded-full bg-white px-4 py-2 font-mono text-sm shadow-hard"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            className="ink-border press rounded-full bg-chog-pink px-5 py-2 font-display text-lg uppercase text-white shadow-hard"
          >
            Look up
          </button>
          <button
            type="button"
            onClick={useConnected}
            className="ink-border press whitespace-nowrap rounded-full bg-white px-5 py-2 font-display text-lg uppercase shadow-hard"
          >
            Use my wallet
          </button>
        </div>
      </div>
      {note && <p className="font-mono text-sm text-chog-pink">{note}</p>}
    </form>
  );
}
