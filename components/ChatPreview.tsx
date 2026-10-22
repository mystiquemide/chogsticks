// Discord-style preview using a real sticker rendered by /api/sticker.
export function ChatPreview({
  tokenId = 21,
  sticker = "wagmi",
  accent = "#2fbf71",
}: {
  tokenId?: number;
  sticker?: string;
  accent?: string;
}) {
  return (
    <div className="ink-border w-full max-w-md -rotate-1 overflow-hidden rounded-[20px] bg-[#313338] text-[#dbdee1] shadow-hard-lg">
      <div className="flex items-center gap-2 border-b border-black/30 px-4 py-3">
        <span className="text-lg text-[#80848e]">#</span>
        <span className="font-semibold text-white">general</span>
      </div>
      <div className="space-y-4 px-4 py-4 text-[15px]">
        <div className="flex gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded-full bg-aqua"
            aria-hidden
          />
          <div>
            <p>
              <span className="font-semibold text-white">mon_maxi</span>{" "}
              <span className="text-xs text-[#949ba4]">Today at 17:45</span>
            </p>
            <p>wen mainnet pump</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chog-pink font-display text-white">
            C
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#949ba4]">
              <span className="text-[#c9cdfb]">chog_holder</span> used{" "}
              <span className="rounded bg-[#5865f2]/30 px-1 text-[#c9cdfb]">
                /chog
              </span>
            </p>
            <p>
              <span className="font-semibold text-white">chogsticks</span>{" "}
              <span className="rounded bg-[#5865f2] px-1 text-[10px] font-semibold text-white">
                APP
              </span>
            </p>
            <div
              className="mt-2 rounded-md border-l-4 bg-[#2b2d31] p-3"
              style={{ borderColor: accent }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/sticker/${tokenId}/${sticker}.gif`}
                alt={`Chog #${tokenId} ${sticker} sticker`}
                width={220}
                height={220}
                className="h-auto w-[180px] sm:w-[220px]"
              />
              <p className="mt-2 text-xs text-[#b5bac1]">
                Chog #{tokenId} credited · chogsticks
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-lg bg-[#383a40] px-3 py-2 text-sm text-[#949ba4]">
          <span className="font-mono text-[#dbdee1]">/chog</span> sticker:
          {sticker} id:{tokenId}
        </div>
      </div>
    </div>
  );
}
