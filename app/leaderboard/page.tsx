import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { INSTALL_URL } from "@/components/Nav";
import { poolUnallocated } from "@/lib/pool";
import { epochEnd, epochStart } from "@/lib/scoring";
import { currentEpoch, topChogs } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Leaderboard · Chogsticks",
  description: "The most memed Chogs this week and all time.",
};

type Props = { searchParams: Promise<{ range?: string }> };

const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });
const day = (ms: number) => {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return d.getUTCHours()
    ? `${date} ${String(d.getUTCHours()).padStart(2, "0")}:00`
    : date;
};

function Tabs({ range }: { range: "week" | "all" }) {
  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`ink-border press rounded-full px-5 py-2 font-display text-lg uppercase shadow-hard ${active ? "bg-chog-pink text-white" : "bg-white"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex gap-3">
      {tab("/leaderboard", "This week", range === "week")}
      {tab("/leaderboard?range=all", "All time", range === "all")}
    </div>
  );
}

async function Board({ searchParams }: Props) {
  await connection();
  const range = (await searchParams).range === "all" ? "all" : "week";
  const epoch = currentEpoch();
  const [rows, unallocated] = await Promise.all([
    topChogs(range === "all" ? "all" : epoch, 50).catch(() => null),
    poolUnallocated().catch(() => null),
  ]);
  const totalScore = rows?.reduce((s, r) => s + r.score, 0) ?? 0;
  const start = epochStart(epoch);
  const end = epochEnd(epoch);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-muted">
          {range === "week"
            ? `Week ${epoch + 1}, ${day(start)} to ${day(end)} UTC. `
            : "Every week since launch. "}
          Score counts different people sending a Chog. Spam from one account
          fades out.
        </p>
        <Tabs range={range} />
      </div>

      {!rows && (
        <p className="text-muted">Leaderboard unavailable right now.</p>
      )}

      {rows && rows.length === 0 && (
        <div className="ink-border flex flex-col items-start gap-4 rounded-[20px] bg-white p-6 shadow-hard-lg">
          <p className="font-display text-2xl uppercase">
            {range === "week" ? "No sends this week yet." : "No sends yet."} Be
            the first.
          </p>
          <div className="flex gap-3">
            <Link
              href="/try"
              className="ink-border press rounded-full bg-white px-5 py-2 font-display text-lg uppercase shadow-hard"
            >
              Try it
            </Link>
            <a
              href={INSTALL_URL}
              className="ink-border press rounded-full bg-chog-pink px-5 py-2 font-display text-lg uppercase text-white shadow-hard"
            >
              Add to Discord
            </a>
          </div>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="ink-border overflow-x-auto rounded-[20px] bg-white shadow-hard-lg">
          <table className="w-full text-left">
            <thead className="border-b-[3px] border-ink font-display text-sm uppercase text-muted">
              <tr>
                <th className="px-3 py-3 sm:px-4">#</th>
                <th className="px-3 py-3 sm:px-4">Chog</th>
                <th className="px-3 py-3 sm:px-4 text-right">Score</th>
                <th className="hidden px-3 py-3 sm:px-4 text-right sm:table-cell">
                  Sends
                </th>
                {range === "week" && (
                  <th className="hidden px-3 py-3 sm:px-4 text-right sm:table-cell">
                    People
                  </th>
                )}
                {range === "week" && (
                  <th className="px-3 py-3 sm:px-4 text-right">Est. $CHOG</th>
                )}
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-b border-ink/10 last:border-0 hover:bg-paper"
                >
                  <td className="px-3 py-3 sm:px-4 font-bold">{i + 1}</td>
                  <td className="px-3 py-3 sm:px-4">
                    <Link
                      href={`/chog/${r.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/sticker/${r.id}/gm.png`}
                        alt=""
                        width={44}
                        height={44}
                        className="h-11 w-11"
                        loading="lazy"
                      />
                      <span className="font-bold">#{r.id}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 sm:px-4 text-right">
                    {fmt(r.score, 2)}
                  </td>
                  <td className="hidden px-3 py-3 sm:px-4 text-right sm:table-cell">
                    {fmt(r.sends)}
                  </td>
                  {range === "week" && (
                    <td className="hidden px-3 py-3 sm:px-4 text-right sm:table-cell">
                      {fmt(r.people)}
                    </td>
                  )}
                  {range === "week" && (
                    <td className="px-3 py-3 sm:px-4 text-right text-green">
                      {unallocated !== null && totalScore > 0
                        ? fmt((r.score / totalScore) * unallocated, 2)
                        : "–"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {range === "week" && rows && rows.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          Est. $CHOG is each Chog&apos;s share of this week&apos;s score times
          the unallocated pool. Final amounts post on Monad when the week ends.
        </p>
      )}
    </>
  );
}

export default function LeaderboardPage({ searchParams }: Props) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="mb-4 font-display text-5xl uppercase leading-none sm:text-6xl">
        Most memed Chogs
      </h1>
      <Suspense
        fallback={
          <div className="h-80 animate-pulse rounded-[20px] bg-ink/10" />
        }
      >
        <Board searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
