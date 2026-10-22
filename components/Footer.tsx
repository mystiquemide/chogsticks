import Link from "next/link";
import { CHOG_NFT, CHOG_TOKEN } from "@/lib/chain";
import { POOL_ADDRESS } from "@/lib/pool";
import { isLive } from "@/lib/routes";
import { INSTALL_URL } from "./Nav";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const scan = (a: string) => `https://monadscan.com/address/${a}`;

const ALL_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Try it", href: "/try" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Pool", href: "/pool" },
    ],
  },
  {
    title: "On Monad",
    links: [
      {
        label: `Payout pool ${short(POOL_ADDRESS)}`,
        href: scan(POOL_ADDRESS),
        mono: true,
      },
      {
        label: `Chog Genesis ${short(CHOG_NFT)}`,
        href: scan(CHOG_NFT),
        mono: true,
      },
      {
        label: `$CHOG ${short(CHOG_TOKEN)}`,
        href: scan(CHOG_TOKEN),
        mono: true,
      },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/mystiquemide/chog-2" },
      { label: "chog.xyz", href: "https://chog.xyz" },
      { label: "Chogathon 2026", href: "https://chogathon.chog.xyz" },
    ],
  },
];

const COLUMNS = ALL_COLUMNS.map((c) => ({
  ...c,
  links: c.links.filter((l) => l.href.startsWith("http") || isLive(l.href)),
})).filter((c) => c.links.length > 0);

export function Footer() {
  return (
    <footer className="mt-auto border-t-[3px] border-ink bg-ink text-paper">
      <div
        className={`mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 ${COLUMNS.length === 3 ? "md:grid-cols-[1.2fr_0.7fr_1.4fr_0.8fr]" : "md:grid-cols-[1.4fr_1.4fr_0.8fr]"}`}
      >
        <div className="flex flex-col gap-4">
          <p className="font-display text-4xl uppercase leading-none">
            Chogsticks
          </p>
          <p className="text-paper/70">
            Your Chog gets paid when the internet uses it.
          </p>
          <a
            href={INSTALL_URL}
            className="press self-start rounded-full border-[3px] border-paper bg-chog-pink px-5 py-2 font-display text-lg uppercase text-white shadow-[4px_4px_0_0_var(--paper)]"
          >
            Add to Discord
          </a>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="mb-3 font-display text-xl uppercase text-chog-pink">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => {
                const external = l.href.startsWith("http");
                const cls = `hover:text-white hover:underline ${"mono" in l && l.mono ? "whitespace-nowrap font-mono text-sm" : ""}`;
                return (
                  <li key={l.label}>
                    {external ? (
                      <a
                        href={l.href}
                        className={cls}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={cls}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-paper/15">
        <div className="mx-auto flex w-full max-w-5xl justify-between px-4 py-5 text-sm text-paper/60">
          <p>© 2026 Chogsticks</p>
        </div>
      </div>
    </footer>
  );
}
