"use client";

import { useState } from "react";

export function StickerTile({
  id,
  name,
  caption,
}: {
  id: number;
  name: string;
  caption: string;
}) {
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const command = `/chog sticker:${name} id:${id}`;
  return (
    <div
      className="ink-border flex flex-col gap-2 rounded-[20px] bg-white p-2 shadow-hard"
      onMouseEnter={() => setLive(true)}
      onMouseLeave={() => setLive(false)}
      onClick={() => setLive(true)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/sticker/${id}/${name}.${live ? "gif" : "png"}`}
        alt={`Chog #${id} ${caption} sticker`}
        width={200}
        height={200}
        className="h-auto w-full"
        loading="lazy"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard?.writeText(command).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="rounded-lg bg-paper px-2 py-1.5 text-left font-mono text-xs hover:bg-ink hover:text-paper"
      >
        {copied ? "Copied" : command}
      </button>
    </div>
  );
}
