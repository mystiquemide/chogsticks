import Link from "next/link";
import { connection } from "next/server";
import { isLive } from "@/lib/routes";
import { currentEpoch, topChogs } from "@/lib/stats";
import { INSTALL_URL } from "./Nav";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-4xl uppercase sm:text-5xl">
          Most memed this week
        </h2>
        {isLive("/leaderboard") && (
          <Link
            href="/leaderboard"
            className="font-display text-lg uppercase underline decoration-[3px] underline-offset-4 hover:text-chog-pink"
          >
            Full leaderboard
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export async function MostMemed() {
  await connection();
  const top = await topChogs(currentEpoch(), 5).catch(() => null);

  if (!top) {
    return (
      <Frame>
        <p className="text-muted">Leaderboard unavailable right now.</p>
      </Frame>
    );
  }

  if (top.length === 0) {
    return (
      <Frame>
        <div className="ink-border flex flex-col items-start gap-4 rounded-[20px] bg-white p-6 shadow-hard-lg">
          <p className="font-display text-2xl uppercase">
            No sends this week yet. Be first.
          </p>
          <a
            href={isLive("/try") ? "/try" : INSTALL_URL}
            className="ink-border press rounded-full bg-chog-pink px-5 py-2 font-display text-lg uppercase text-white shadow-hard"
          >
            {isLive("/try") ? "Try it" : "Add to Discord"}
          </a>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {top.map((c, i) => (
          <li key={c.id}>
            <Link
              href={`/chog/${c.id}`}
              className="ink-border press group flex flex-col gap-2 rounded-[20px] bg-white p-3 shadow-hard"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/sticker/${c.id}/gm.png`}
                  alt={`Chog #${c.id}`}
                  width={200}
                  height={200}
                  className="h-auto w-full"
                />
                <span className="ink-border absolute -left-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-purple font-mono text-sm font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <span className="flex items-baseline gap-1.5 leading-none">
                <span className="font-display text-2xl uppercase">Chog</span>
                <span className="font-mono text-lg font-bold">#{c.id}</span>
              </span>
              <span className="font-mono text-sm text-muted">
                {c.sends} {c.sends === 1 ? "send" : "sends"} · {c.people}{" "}
                {c.people === 1 ? "person" : "people"}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

export function MostMemedFallback() {
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-[20px] bg-ink/10"
          />
        ))}
      </div>
    </Frame>
  );
}
