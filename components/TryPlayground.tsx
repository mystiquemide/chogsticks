"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Sticker = { name: string; caption: string; url: string; gif: string };
type Pack = { id: number; traits: Record<string, string>; stickers: Sticker[] };

const MAX_ID = 1969;

export function TryPlayground({ installUrl }: { installUrl: string }) {
  const [input, setInput] = useState("21");
  const [pack, setPack] = useState<Pack | null>(null);
  const [selected, setSelected] = useState("gm");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const id = Number(input);
  const validId = Number.isInteger(id) && id >= 1 && id <= MAX_ID;

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    fetch(`/api/stickers/${id}`)
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((p: Pack) => {
        if (cancelled) return;
        setPack(p);
        setError(null);
        setSelected((s) => (p.stickers.some((x) => x.name === s) ? s : "gm"));
      })
      .catch(
        () => !cancelled && setError("Couldn't load that Chog. Try again."),
      );
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  const current = pack?.stickers.find((s) => s.name === selected);
  const command = `/chog sticker:${selected} id:${pack?.id ?? id}`;

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="ink-border flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-4 shadow-hard-lg">
        <label className="flex flex-col gap-1">
          <span className="font-display text-sm uppercase text-muted">
            Chog id
          </span>
          <input
            inputMode="numeric"
            value={input}
            onChange={(e) =>
              setInput(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="ink-border w-32 rounded-xl bg-paper px-3 py-2 font-mono text-2xl font-bold outline-none focus:bg-white"
            aria-invalid={!validId}
          />
        </label>
        <button
          type="button"
          onClick={() =>
            setInput(String(1 + Math.floor(Math.random() * MAX_ID)))
          }
          className="ink-border press rounded-full bg-purple px-5 py-2.5 font-display text-lg uppercase text-white shadow-hard"
        >
          Random Chog
        </button>
        {!validId && (
          <p className="font-mono text-sm text-chog-pink">Ids run 1 to 1969.</p>
        )}
        {error && <p className="font-mono text-sm text-chog-pink">{error}</p>}
      </div>

      {pack && current && (
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.gif}
              src={current.gif}
              alt={`Chog #${pack.id} ${current.caption} sticker`}
              width={480}
              height={480}
              className="mx-auto h-auto w-full max-w-[420px]"
            />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="flex items-baseline gap-2">
              <span className="font-display text-5xl uppercase leading-none">
                Chog
              </span>{" "}
              <span className="font-mono text-4xl font-bold">#{pack.id}</span>
            </h2>
            <div className="ink-border rounded-2xl bg-white p-4 shadow-hard">
              <p className="mb-2 font-display text-sm uppercase text-muted">
                Send it in Discord
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-sm text-paper">
                  {command}
                </code>
                <button
                  type="button"
                  onClick={() => copy(command, "command")}
                  className="ink-border press rounded-full bg-chog-pink px-4 py-2 font-display uppercase text-white shadow-hard"
                >
                  {copied === "command" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  copy(
                    new URL(current.gif, window.location.origin).toString(),
                    "link",
                  )
                }
                className="ink-border press rounded-full bg-white px-4 py-2 font-display uppercase shadow-hard"
              >
                {copied === "link" ? "Link copied" : "Copy GIF link"}
              </button>
              <a
                href={current.gif}
                download={`chog-${pack.id}-${current.name}.gif`}
                className="ink-border press rounded-full bg-white px-4 py-2 font-display uppercase shadow-hard"
              >
                Download GIF
              </a>
              <a
                href={installUrl}
                className="ink-border press rounded-full bg-chog-pink px-4 py-2 font-display uppercase text-white shadow-hard"
              >
                Add to Discord
              </a>
            </div>
            <p className="text-sm text-muted">
              Stickers sent from this page aren&apos;t credited. Only sends
              through <span className="font-mono">/chog</span> in Discord count
              toward a Chog&apos;s earnings.
            </p>
            <Link
              href={`/chog/${pack.id}`}
              className="font-display text-lg uppercase underline decoration-[3px] underline-offset-4 hover:text-chog-pink"
            >
              See Chog <span className="font-mono font-bold">#{pack.id}</span>&apos;s stats
            </Link>
          </div>
        </div>
      )}

      {pack && (
        <section>
          <h3 className="mb-4 font-display text-3xl uppercase">
            Pick a sticker
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-9">
            {pack.stickers.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setSelected(s.name)}
                aria-pressed={s.name === selected}
                className={`ink-border press rounded-2xl p-1.5 shadow-hard ${s.name === selected ? "bg-chog-pink" : "bg-white"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.url}
                  alt={s.caption}
                  width={120}
                  height={120}
                  className="h-auto w-full"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
