const POINTS = [
  {
    title: "No NFT, no pack",
    body: "Every sticker is made from one token's own on-chain art and traits. 1,969 Chogs, 1,969 different packs.",
  },
  {
    title: "No NFT, no payee",
    body: "Every send is credited to a token ID. Payouts go to whoever holds that token when they claim.",
  },
  {
    title: "Sell it, income moves",
    body: "Transfer your Chog and its future earnings go with it. Usage becomes part of what the NFT is worth.",
  },
];

export function WhyNft() {
  return (
    <section className="border-y-[3px] border-ink bg-purple text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="mb-2 font-display text-4xl uppercase sm:text-5xl">
          Take the NFT out. It stops working.
        </h2>
        <p className="mb-8 max-w-2xl text-lg text-white/85">
          Every part of Chogsticks runs on the token itself.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="ink-border rounded-[20px] bg-white p-5 text-ink shadow-hard-lg"
            >
              <h3 className="mb-2 font-display text-2xl uppercase leading-none">
                {p.title}
              </h3>
              <p className="text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
