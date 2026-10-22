import { Suspense } from "react";
import { ChatPreview } from "@/components/ChatPreview";
import { Footer } from "@/components/Footer";
import { isLive } from "@/lib/routes";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyNft } from "@/components/WhyNft";
import { MostMemed, MostMemedFallback } from "@/components/MostMemed";
import { INSTALL_URL } from "@/components/Nav";
import { StatsStrip, StatsStripFallback } from "@/components/StatsStrip";

export default function Home() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
            Your Chog gets paid when the internet uses it.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Every Chog Genesis NFT is an animated sticker pack. Send it anywhere
            with <span className="font-mono text-ink">/chog</span>. Every send
            is counted for that Chog, and its holder gets paid in $CHOG.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={INSTALL_URL}
              className="ink-border press rounded-full bg-chog-pink px-6 py-3 font-display text-xl uppercase text-white shadow-hard"
            >
              Add to Discord
            </a>
            {isLive("/try") && (
              <a
                href="/try"
                className="ink-border press rounded-full bg-white px-6 py-3 font-display text-xl uppercase shadow-hard"
              >
                Try it now
              </a>
            )}
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <ChatPreview />
        </div>
      </section>
      <section className="border-y-[3px] border-ink bg-white">
        <div className="mx-auto w-full max-w-5xl">
          <Suspense fallback={<StatsStripFallback />}>
            <StatsStrip />
          </Suspense>
        </div>
      </section>
      <HowItWorks />
      <Suspense fallback={<MostMemedFallback />}>
        <MostMemed />
      </Suspense>
      <WhyNft />
      <Footer />
    </main>
  );
}
