import type { Metadata } from "next";
import { INSTALL_URL } from "@/components/Nav";
import { TryPlayground } from "@/components/TryPlayground";

export const metadata: Metadata = {
  title: "Try it · Chogsticks",
  description: "Play with any Chog's animated sticker pack. No Discord needed.",
};

export default function TryPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="mb-2 font-display text-5xl uppercase leading-none sm:text-6xl">
        Try it. No Discord needed.
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-muted">
        Pick any of the 1,969 Chogs and see its animated sticker pack. Copy the
        command to send it for real.
      </p>
      <TryPlayground installUrl={INSTALL_URL} />
    </main>
  );
}
