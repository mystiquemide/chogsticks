import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StickerTile } from "@/components/StickerTile";
import { INSTALL_URL } from "@/components/Nav";
import { ownerOf, poolUnallocated } from "@/lib/pool";
import { tokenStats } from "@/lib/stats";
import { isLive } from "@/lib/routes";
import { getToken, stickersFor } from "@/lib/stickers";

type Props = { params: Promise<{ id: string }> };

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) ? getToken(id) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const token = parseId((await params).id);
  if (!token) return { title: "Chog not found · Chogsticks" };
  return {
    title: `Chog #${token.id} · Chogsticks`,
    description: `Chog #${token.id}'s sticker pack, sends, and $CHOG earnings.`,
    openGraph: { images: [`/api/sticker/${token.id}/gm.png`] },
  };
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

async function Stats({ id }: { id: number }) {
  await connection();
  const [stats, owner, unallocated] = await Promise.all([
    tokenStats(id).catch(() => null),
    ownerOf(id).catch(() => null),
    poolUnallocated().catch(() => null),
  ]);
  const max = stats ? Math.max(1, ...stats.last7.map((d) => d.sends)) : 1;
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: stats ? fmt(stats.weekSends) : "–", l: "Sends this week" },
          { v: stats ? fmt(stats.people) : "–", l: "People" },
          { v: stats?.rank ? `#${stats.rank}` : "–", l: "Rank" },
        ].map((s) => (
          <div
            key={s.l}
            className="ink-border rounded-2xl bg-white p-3 shadow-hard"
          >
            <p className="font-mono text-2xl font-bold sm:text-3xl">{s.v}</p>
            <p className="font-display text-sm uppercase text-muted">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="ink-border rounded-2xl bg-white p-4 shadow-hard">
        <p className="font-display text-sm uppercase text-muted">Earning for</p>
        {owner ? (
          <a
            href={`https://monadscan.com/address/${owner}`}
            className="font-mono text-lg font-bold hover:underline"
          >
            {short(owner)}
          </a>
        ) : (
          <p className="font-mono text-muted">Owner lookup unavailable</p>
        )}
        <p className="mt-1 text-sm text-muted">
          The current holder. Sell this Chog and its earnings go to the buyer.
        </p>
        {stats && unallocated !== null && (
          <p className="mt-3 font-mono text-sm">
            Est. this week:{" "}
            <span className="font-bold text-green">
              {fmt(stats.share * unallocated, 2)} $CHOG
            </span>
            <span className="text-muted">
              {" "}
              ({fmt(stats.share * 100, 1)}% of usage)
            </span>
          </p>
        )}
      </div>
      {stats && (
        <div className="ink-border rounded-2xl bg-white p-4 shadow-hard">
          <p className="mb-3 font-display text-sm uppercase text-muted">
            Last 7 days
          </p>
          <div className="flex h-24 items-end gap-2">
            {stats.last7.map((d) => (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="font-mono text-xs">{d.sends || ""}</span>
                <div
                  className="w-full rounded-t-md border-2 border-ink bg-chog-pink"
                  style={{
                    height: `${Math.max(4, (d.sends / max) * 72)}px`,
                    opacity: d.sends ? 1 : 0.25,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {stats && stats.allSends === 0 && (
        <div className="ink-border rounded-2xl bg-white p-4 shadow-hard">
          <p className="font-display text-xl uppercase">
            Nobody&apos;s spammed Chog #{id} yet.
          </p>
          <p className="mb-3 text-muted">
            Send it somewhere and start its count.
          </p>
          <a
            href={INSTALL_URL}
            className="ink-border press inline-block rounded-full bg-chog-pink px-4 py-2 font-display uppercase text-white shadow-hard"
          >
            Add to Discord
          </a>
        </div>
      )}
    </>
  );
}

export default function ChogPage({ params }: Props) {
  return (
    <Suspense
      fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10" />}
    >
      <ChogBody params={params} />
    </Suspense>
  );
}

async function ChogBody({ params }: Props) {
  const token = parseId((await params).id);
  if (!token) notFound();
  const pack = stickersFor(token);
  const traits = Object.entries(token.traits).filter(
    ([k]) => !["Base", "Naked", "Form"].includes(k),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link
        href={isLive("/leaderboard") ? "/leaderboard" : "/"}
        className="font-display text-lg uppercase hover:text-chog-pink"
      >
        ← {isLive("/leaderboard") ? "Leaderboard" : "Home"}
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/sticker/${token.id}/gm.gif`}
            alt={`Chog #${token.id}`}
            width={320}
            height={320}
            className="h-auto w-full"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="flex items-baseline gap-3">
            <span className="font-display text-6xl uppercase leading-none">
              Chog
            </span>
            <span className="font-mono text-5xl font-bold">#{token.id}</span>
          </h1>
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
            }
          >
            <Stats id={token.id} />
          </Suspense>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-4xl uppercase">The pack</h2>
        <p className="mb-4 text-muted">
          Hover or tap to play. Click a command to copy it into Discord.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {pack.map((s) => (
            <StickerTile
              key={s.name}
              id={token.id}
              name={s.name}
              caption={s.caption}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-4xl uppercase">Traits</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {traits.map(([k, v]) => (
            <div key={k} className="ink-border rounded-2xl bg-white p-3">
              <dt className="font-display text-sm uppercase text-muted">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
