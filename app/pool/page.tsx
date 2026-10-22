import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import activity from "@/data/pool-activity.json";
import { epochRoots, POOL_ADDRESS, poolBalances, poster } from "@/lib/pool";
import { epochEnd, epochStart } from "@/lib/scoring";
import { currentEpoch } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Pool · Chogsticks",
  description:
    "The $CHOG payout pool on Monad: balance, weekly payouts, and how it works.",
};

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const day = (ms: number) => {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return d.getUTCHours() ? `${date} ${String(d.getUTCHours()).padStart(2, "0")}:00` : date;
};
const scan = (kind: "address" | "tx", v: string) =>
  `https://monadscan.com/${kind}/${v}`;

function Card({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="ink-border rounded-2xl bg-white p-4 shadow-hard">
      <p
        className={`font-mono text-3xl font-bold ${accent ? "text-green" : ""}`}
      >
        {value}
      </p>
      <p className="font-display text-sm uppercase text-muted">{label}</p>
    </div>
  );
}

async function Live() {
  await connection();
  const epoch = currentEpoch();
  const [bal, roots, posterAddr] = await Promise.all([
    poolBalances().catch(() => null),
    epochRoots(epoch).catch(() => null),
    poster().catch(() => null),
  ]);
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          value={bal ? fmt(bal.balance - bal.allocated) : "–"}
          label="$CHOG available"
          accent
        />
        <Card
          value={bal ? fmt(bal.allocated) : "–"}
          label="Allocated, not yet claimed"
        />
        <Card value={bal ? fmt(bal.balance) : "–"} label="Total in contract" />
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-4xl uppercase">Weekly payouts</h2>
        <div className="ink-border overflow-hidden rounded-[20px] bg-white shadow-hard-lg">
          <table className="w-full text-left">
            <thead className="border-b-[3px] border-ink font-display text-sm uppercase text-muted">
              <tr>
                <th className="px-3 py-3 sm:px-4">Week</th>
                <th className="px-3 py-3 sm:px-4">Dates (UTC)</th>
                <th className="px-3 py-3 text-right sm:px-4">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {(roots ?? []).map((r) => {
                const start = epochStart(r.epoch);
                const end = epochEnd(r.epoch);
                return (
                  <tr
                    key={r.epoch}
                    className="border-b border-ink/10 last:border-0"
                  >
                    <td className="px-3 py-3 font-bold sm:px-4">
                      {r.epoch + 1}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      {day(start)} to {day(end)}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-4">
                      {r.posted ? (
                        <span className="text-green">
                          Posted · {fmt(r.remaining)} left to claim
                        </span>
                      ) : r.epoch === epoch ? (
                        <span className="text-muted">
                          Counting, closes {day(end)}
                        </span>
                      ) : (
                        <span className="text-muted">Not posted</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!roots && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-muted">
                    Chain data unavailable right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-4xl uppercase">
          Who controls what
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          <li className="ink-border rounded-2xl bg-white p-4">
            <p className="mb-1 font-display text-xl uppercase">Anyone</p>
            <p className="text-muted">Can add $CHOG to the pool with fund().</p>
          </li>
          <li className="ink-border rounded-2xl bg-white p-4">
            <p className="mb-1 font-display text-xl uppercase">The poster</p>
            <p className="text-muted">
              Posts one payout list per week, never more than the pool holds. It
              has no withdraw function.{" "}
              {posterAddr && (
                <a
                  href={scan("address", posterAddr)}
                  className="font-mono text-ink hover:underline"
                >
                  {short(posterAddr)}
                </a>
              )}
            </p>
          </li>
          <li className="ink-border rounded-2xl bg-white p-4">
            <p className="mb-1 font-display text-xl uppercase">Chog holders</p>
            <p className="text-muted">
              Claim their Chog&apos;s share with a proof. The contract checks
              they own the token at that moment.
            </p>
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted">
          Sends are counted on the Chogsticks server with the anti-spam rules,
          then settled on Monad once a week.
        </p>
      </section>
    </>
  );
}

export default function PoolPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="mb-2 font-display text-5xl uppercase leading-none sm:text-6xl">
        The pool
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-muted">
        $CHOG that pays Chog holders for how much their Chog gets used.{" "}
        <a
          href={scan("address", POOL_ADDRESS)}
          className="font-mono text-ink underline"
        >
          {short(POOL_ADDRESS)}
        </a>{" "}
        on Monad, source verified.
      </p>

      <Suspense
        fallback={<div className="h-28 animate-pulse rounded-2xl bg-ink/10" />}
      >
        <Live />
      </Suspense>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-4xl uppercase">Activity</h2>
        <ul className="ink-border divide-y divide-ink/10 overflow-hidden rounded-[20px] bg-white shadow-hard-lg">
          {[...activity].reverse().map((a) => (
            <li
              key={a.tx}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{a.label}</span>
              <span className="flex gap-4 font-mono text-sm text-muted">
                <span>{a.date}</span>
                <a href={scan("tx", a.tx)} className="text-ink hover:underline">
                  {short(a.tx)}
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
