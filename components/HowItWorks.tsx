import { POOL_ADDRESS } from "@/lib/pool";

function Step({
  n,
  title,
  children,
  color,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className="ink-border flex flex-col gap-4 rounded-[20px] bg-white p-5 shadow-hard-lg">
      <div className="flex items-center gap-3">
        <span
          className={`ink-border flex h-10 w-10 items-center justify-center rounded-full font-mono text-lg font-bold ${color}`}
        >
          {n}
        </span>
        <h3 className="font-display text-3xl uppercase leading-none">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h2 className="mb-8 font-display text-4xl uppercase sm:text-5xl">
        How it works
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        <Step n={1} title="Send" color="bg-chog-pink text-white">
          <p className="text-muted">
            Type <span className="font-mono text-ink">/chog</span> in any
            Discord server or DM. Pick a sticker and a Chog.
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-paper p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/sticker/21/gm.png"
              alt="Chog #21 GM sticker"
              width={72}
              height={72}
              className="h-[72px] w-[72px]"
            />
            <span className="font-mono text-sm">/chog sticker:gm id:21</span>
          </div>
        </Step>
        <Step n={2} title="Count" color="bg-aqua">
          <p className="text-muted">
            Every send is credited to that Chog. Different people count.
            Spamming doesn&apos;t.
          </p>
          <ul className="space-y-1 rounded-xl bg-paper p-3 font-mono text-sm">
            <li className="flex justify-between">
              <span>1st send</span>
              <span className="text-green">+1</span>
            </li>
            <li className="flex justify-between">
              <span>2nd send, same person</span>
              <span className="text-green">+0.5</span>
            </li>
            <li className="flex justify-between">
              <span>6th send that day</span>
              <span className="text-muted">+0</span>
            </li>
            <li className="flex justify-between">
              <span>Account under 30 days old</span>
              <span className="text-muted">+0</span>
            </li>
          </ul>
        </Step>
        <Step n={3} title="Claim" color="bg-green text-white">
          <p className="text-muted">
            Each week the pool pays out on Monad. Whoever holds the Chog claims
            its $CHOG share. Sell it and the income goes with it.
          </p>
          <a
            href={`https://monadscan.com/address/${POOL_ADDRESS}`}
            className="flex items-center justify-between rounded-xl bg-paper p-3 font-mono text-sm hover:underline"
          >
            <span>
              Pool {POOL_ADDRESS.slice(0, 6)}…{POOL_ADDRESS.slice(-4)}
            </span>
            <span aria-hidden>↗</span>
          </a>
        </Step>
      </div>
    </section>
  );
}
