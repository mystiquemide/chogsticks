import Link from "next/link";
import { Suspense } from "react";
import { isLive } from "@/lib/routes";
import { NavLinks } from "./NavLinks";

export const INSTALL_URL = `https://discord.com/oauth2/authorize?client_id=${process.env.CHOGSTICKS_Application_ID ?? ""}`;

const ALL_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/try", label: "Try it" },
  { href: "/pool", label: "Pool" },
  { href: "/my", label: "My Chogs" },
];
const LINKS = ALL_LINKS.filter((l) => isLive(l.href));

function Mark() {
  return (
    <svg viewBox="0 0 120 120" className="h-9 w-9" aria-hidden>
      <path
        d="M10 22a8 8 0 0 1 8-8h72l18 18v66a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8z"
        transform="translate(5 5)"
        fill="#141014"
      />
      <path
        d="M10 22a8 8 0 0 1 8-8h72l18 18v66a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8z"
        fill="#A85CDF"
        stroke="#141014"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M90 14v12a6 6 0 0 0 6 6h12z"
        fill="#F3EDDC"
        stroke="#141014"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle
        cx="102"
        cy="20"
        r="16"
        fill="#2FBF71"
        stroke="#141014"
        strokeWidth="5"
      />
      <text
        x="102"
        y="27"
        fontFamily="Inter,Arial"
        fontWeight="800"
        fontSize="20"
        textAnchor="middle"
        fill="#141014"
      >
        $
      </text>
    </svg>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-paper/95 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Mark />
          <span className="font-display text-2xl uppercase leading-none">
            Chogsticks
          </span>
        </Link>
        {LINKS.length > 0 && (
          <ul className="ml-auto hidden items-center gap-6 md:flex">
            <Suspense
              fallback={LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-display text-lg uppercase hover:text-chog-pink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            >
              <NavLinks links={LINKS} variant="bar" />
            </Suspense>
          </ul>
        )}
        <a
          href={INSTALL_URL}
          className={`ink-border press ml-auto whitespace-nowrap rounded-full bg-chog-pink px-4 py-1.5 font-display text-base uppercase text-white shadow-hard ${LINKS.length > 0 ? "md:ml-0" : ""}`}
        >
          <span className="md:hidden">Install</span>
          <span className="hidden md:inline">Add to Discord</span>
        </a>
        {LINKS.length > 0 && (
          <details data-menu className="relative md:hidden">
            <summary
              className="ink-border flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-white shadow-hard [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="#141014"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </summary>
            <ul className="ink-border absolute right-0 mt-3 w-48 rounded-[20px] bg-white p-2 shadow-hard-lg">
              <Suspense
                fallback={LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block rounded-xl px-3 py-2 font-display text-lg uppercase hover:bg-paper"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              >
                <NavLinks links={LINKS} variant="menu" />
              </Suspense>
            </ul>
          </details>
        )}
      </nav>
    </header>
  );
}
