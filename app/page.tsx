import { INSTALL_URL } from "@/components/Nav";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
        Your Chog gets paid when the internet uses it.
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Every Chog Genesis NFT is a sticker pack. Send it anywhere with <span className="font-mono text-ink">/chog</span>.
      </p>
      <div className="flex flex-wrap gap-4">
        <a
          href={INSTALL_URL}
          className="ink-border press rounded-full bg-chog-pink px-6 py-3 font-display text-xl uppercase text-white shadow-hard"
        >
          Add to Discord
        </a>
        <a href="/try" className="ink-border press rounded-full bg-white px-6 py-3 font-display text-xl uppercase shadow-hard">
          Try it now
        </a>
      </div>
    </main>
  );
}
