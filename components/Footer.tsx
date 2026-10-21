import { POOL_ADDRESS } from "@/lib/pool";

export function Footer() {
  return (
    <footer className="mt-auto border-t-[3px] border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg uppercase">
          Built for Chogathon 2026
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono">
          <li>
            <a
              href={`https://monadscan.com/address/${POOL_ADDRESS}`}
              className="hover:underline"
            >
              Pool {POOL_ADDRESS.slice(0, 6)}…{POOL_ADDRESS.slice(-4)} ↗
            </a>
          </li>
          <li>
            <a
              href="https://github.com/mystiquemide/chog-2"
              className="hover:underline"
            >
              GitHub ↗
            </a>
          </li>
          <li>
            <a href="https://chog.xyz" className="hover:underline">
              chog.xyz ↗
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
