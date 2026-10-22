import { connection } from "next/server";
import { poolBalances } from "@/lib/pool";
import { overview } from "@/lib/stats";

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits });

function Stat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-5">
      <span
        className={`font-mono text-3xl font-bold sm:text-4xl ${accent ? "text-green" : "text-ink"}`}
      >
        {value}
      </span>
      <span className="font-display text-base uppercase text-muted">
        {label}
      </span>
    </div>
  );
}

export async function StatsStrip() {
  await connection();
  const [usage, pool] = await Promise.all([
    overview().catch(() => null),
    poolBalances().catch(() => null),
  ]);
  return (
    <div className="grid grid-cols-2 divide-ink sm:grid-cols-4 sm:divide-x-[3px]">
      <Stat value={usage ? fmt(usage.sends) : "–"} label="Stickers sent" />
      <Stat value={usage ? fmt(usage.people) : "–"} label="People sending" />
      <Stat value={usage ? fmt(usage.chogs) : "–"} label="Chogs credited" />
      <Stat
        value={pool ? fmt(pool.balance, 2) : "–"}
        label="$CHOG in pool"
        accent
      />
    </div>
  );
}

export function StatsStripFallback() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4">
      {[
        "Stickers sent",
        "People sending",
        "Chogs credited",
        "$CHOG in pool",
      ].map((l) => (
        <div key={l} className="flex flex-col gap-1 px-4 py-5">
          <span className="h-9 w-20 animate-pulse rounded bg-ink/10" />
          <span className="font-display text-base uppercase text-muted">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}
