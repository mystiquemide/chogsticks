import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { isAddress } from "viem";
import { ClaimAllButton } from "@/components/ClaimAllButton";
import { WalletForm } from "@/components/WalletForm";
import { holdingsOf } from "@/lib/holdings";
import { POOL_ADDRESS } from "@/lib/pool";

export const metadata: Metadata = {
  title: "My Chogs · Chogsticks",
  description:
    "Every Chog a wallet holds, what each one earned, and one button to claim it all.",
};

type Props = { searchParams: Promise<{ wallet?: string }> };

const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

async function Results({ wallet }: { wallet: string }) {
  await connection();
  if (!isAddress(wallet))
    return (
      <p className="font-mono text-sm text-chog-pink">
        That doesn&apos;t look like a wallet address. It should start with 0x
        and have 42 characters.
      </p>
    );

  const chogs = await holdingsOf(wallet).catch(() => null);
  if (!chogs)
    return (
      <p className="font-mono text-sm text-chog-pink">
        Couldn&apos;t reach Monad just now. Try again in a minute.
      </p>
    );
  if (chogs.length === 0)
    return (
      <div className="ink-border flex flex-col items-start gap-4 rounded-[20px] bg-white p-6 shadow-hard-lg">
        <p className="font-display text-2xl uppercase">
          No Chogs in{" "}
          <span className="font-mono text-xl normal-case">{short(wallet)}</span>
        </p>
        <p className="text-muted">
          Only the wallet holding a Chog earns from it. Check the address, or
          browse the packs anyway.
        </p>
        <Link
          href="/try"
          className="ink-border press rounded-full bg-white px-5 py-2 font-display text-lg uppercase shadow-hard"
        >
          Try a pack
        </Link>
      </div>
    );

  const payouts = chogs.flatMap((c) => c.unclaimed);
  const owed = payouts.reduce((s, p) => s + Number(p.amount) / 1e18, 0);
  const estimate = chogs.reduce((s, c) => s + c.estimate, 0);
  const sends = chogs.reduce((s, c) => s + c.weekSends, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: fmt(chogs.length), l: "Chogs held" },
          { v: fmt(sends), l: "Sends this week" },
          { v: fmt(estimate, 2), l: "Est. $CHOG this week", c: "text-green" },
          { v: fmt(owed, 4), l: "Ready to claim", c: "text-green" },
        ].map((s) => (
          <div
            key={s.l}
            className="ink-border rounded-2xl bg-white p-3 shadow-hard"
          >
            <p
              className={`font-mono text-2xl font-bold sm:text-3xl ${s.c ?? ""}`}
            >
              {s.v}
            </p>
            <p className="font-display text-sm uppercase text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      {payouts.length > 0 ? (
        <ClaimAllButton pool={POOL_ADDRESS} wallet={wallet} payouts={payouts} />
      ) : (
        <p className="text-sm text-muted">
          Nothing to claim yet. Payouts post on Monad when each week closes.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {chogs.map((c) => (
          <li key={c.id}>
            <Link
              href={`/chog/${c.id}`}
              className="ink-border press flex flex-col overflow-hidden rounded-[20px] bg-white shadow-hard"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/sticker/${c.id}/gm.png`}
                alt={`Chog #${c.id}`}
                loading="lazy"
                className="aspect-square w-full border-b-[3px] border-ink bg-paper object-cover"
              />
              <div className="flex flex-col gap-1 p-3">
                <p className="flex items-baseline justify-between">
                  <span className="font-display text-xl uppercase">
                    Chog <span className="font-mono">#{c.id}</span>
                  </span>
                  {c.rank && (
                    <span className="font-mono text-sm text-chog-pink">
                      #{c.rank}
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-muted">
                  {fmt(c.weekSends)} this week · {fmt(c.allSends)} all time
                </p>
                <p className="font-mono text-xs text-green">
                  {c.unclaimed.length
                    ? `${fmt(
                        c.unclaimed.reduce(
                          (s, p) => s + Number(p.amount) / 1e18,
                          0,
                        ),
                        4,
                      )} to claim`
                    : c.estimate > 0
                      ? `~${fmt(c.estimate, 2)} $CHOG this week`
                      : "No credited sends yet"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Body({ searchParams }: Props) {
  const wallet = ((await searchParams).wallet ?? "").trim();
  return (
    <>
      <div className="mb-8">
        <WalletForm initial={wallet} />
      </div>
      {wallet && (
        <Suspense
          key={wallet}
          fallback={
            <div
              aria-busy="true"
              aria-label="Finding Chogs"
              className="h-64 animate-pulse rounded-[20px] bg-ink/10"
            />
          }
        >
          <Results wallet={wallet} />
        </Suspense>
      )}
    </>
  );
}

export default function MyChogsPage({ searchParams }: Props) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="mb-2 font-display text-5xl uppercase leading-none sm:text-6xl">
        My Chogs
      </h1>
      <p className="mb-6 text-muted">
        Every Chog a wallet holds, what it earned, and one button to claim it
        all.
      </p>
      <Suspense
        fallback={<div className="h-28 animate-pulse rounded-2xl bg-ink/10" />}
      >
        <Body searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
