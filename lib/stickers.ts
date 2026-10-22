import { readFileSync } from "node:fs";
import path from "node:path";
import { parse, type Font, type Glyph } from "opentype.js";
import sharp from "sharp";
import tokens from "@/data/tokens.json";

export type Token = {
  id: number;
  image: string;
  traits: Record<string, string>;
};

type Effect = "none" | "gray" | "zoom" | "fried";
type Overlay = "rays" | "speed" | "sparkles" | "sweat" | "none";
type Motion = "punch" | "spin" | "slam" | "wobble" | "bounce" | "strobe";
type CaptionStyle = "pop" | "stamp";

export type StickerDef = {
  name: string;
  caption: string;
  effect: Effect;
  overlay: Overlay;
  motion: Motion;
  color: string;
  style?: CaptionStyle;
  tint?: string;
};

const TOKENS = tokens as Token[];
const BY_ID = new Map(TOKENS.map((t) => [t.id, t]));

export const IMAGE_CID =
  "bafybeihau2egcccbdxymeckmmbrqytbfor5gkt3en6d5fsbueymdbq7g6e";
const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
];

const INK = "#141014";
const YELLOW = "#FFD23F";
const GREEN = "#2FBF71";
const RED = "#FF3B30";
const AQUA = "#7FD3D6";
const ORANGE = "#FF7A1A";
const PINK = "#E46FAE";
const PURPLE = "#A85CDF";

export const BASE_STICKERS: StickerDef[] = [
  {
    name: "gm",
    caption: "GM",
    effect: "none",
    overlay: "rays",
    motion: "spin",
    color: YELLOW,
    tint: YELLOW,
  },
  {
    name: "wagmi",
    caption: "WAGMI",
    effect: "none",
    overlay: "sparkles",
    motion: "bounce",
    color: GREEN,
  },
  {
    name: "ngmi",
    caption: "NGMI",
    effect: "gray",
    overlay: "none",
    motion: "slam",
    color: RED,
    style: "stamp",
  },
  {
    name: "cope",
    caption: "COPE",
    effect: "none",
    overlay: "sweat",
    motion: "wobble",
    color: AQUA,
    tint: "#3A7BD5",
  },
  {
    name: "lfg",
    caption: "LFG",
    effect: "zoom",
    overlay: "speed",
    motion: "punch",
    color: ORANGE,
  },
  {
    name: "chog-on",
    caption: "CHOG ON",
    effect: "fried",
    overlay: "rays",
    motion: "strobe",
    color: PINK,
    tint: PURPLE,
  },
];

// Trait stickers: first match per trait wins, max 3 per token.
const TRAIT_RULES: { trait: string; match: RegExp; sticker: StickerDef }[] = [
  {
    trait: "Eyes",
    match: /btc/i,
    sticker: {
      name: "number-go-up",
      caption: "NUMBER GO UP",
      effect: "none",
      overlay: "speed",
      motion: "punch",
      color: GREEN,
    },
  },
  {
    trait: "Eyes",
    match: /laser/i,
    sticker: {
      name: "laser-eyes",
      caption: "LASER EYES",
      effect: "zoom",
      overlay: "speed",
      motion: "strobe",
      color: RED,
      tint: RED,
    },
  },
  {
    trait: "Eyes",
    match: /^dead$/i,
    sticker: {
      name: "im-dead",
      caption: "IM DEAD",
      effect: "gray",
      overlay: "none",
      motion: "slam",
      color: RED,
      style: "stamp",
    },
  },
  {
    trait: "Eyes",
    match: /heart/i,
    sticker: {
      name: "love-this",
      caption: "LOVE THIS",
      effect: "none",
      overlay: "sparkles",
      motion: "bounce",
      color: PINK,
    },
  },
  {
    trait: "Eyes",
    match: /cry|tear/i,
    sticker: {
      name: "sad-boi",
      caption: "SAD BOI",
      effect: "gray",
      overlay: "sweat",
      motion: "wobble",
      color: AQUA,
      tint: "#3A7BD5",
    },
  },
  {
    trait: "Eyes",
    match: /side eye/i,
    sticker: {
      name: "side-eye",
      caption: "SIDE EYE",
      effect: "zoom",
      overlay: "none",
      motion: "wobble",
      color: YELLOW,
    },
  },
  {
    trait: "Mouth",
    match: /rainbow puke/i,
    sticker: {
      name: "sick",
      caption: "SICK",
      effect: "fried",
      overlay: "speed",
      motion: "punch",
      color: GREEN,
    },
  },
  {
    trait: "Mouth",
    match: /drool/i,
    sticker: {
      name: "want",
      caption: "WANT",
      effect: "none",
      overlay: "sparkles",
      motion: "bounce",
      color: PINK,
    },
  },
  {
    trait: "Mouth",
    match: /gold tooth/i,
    sticker: {
      name: "rich",
      caption: "RICH",
      effect: "none",
      overlay: "rays",
      motion: "spin",
      color: YELLOW,
      tint: YELLOW,
    },
  },
  {
    trait: "Accessory",
    match: /green candle/i,
    sticker: {
      name: "pump-it",
      caption: "PUMP IT",
      effect: "none",
      overlay: "speed",
      motion: "punch",
      color: GREEN,
    },
  },
  {
    trait: "Accessory",
    match: /red candle/i,
    sticker: {
      name: "dump-it",
      caption: "DUMP IT",
      effect: "gray",
      overlay: "none",
      motion: "slam",
      color: RED,
      style: "stamp",
    },
  },
  {
    trait: "Accessory",
    match: /knife/i,
    sticker: {
      name: "stabby",
      caption: "STABBY",
      effect: "fried",
      overlay: "speed",
      motion: "strobe",
      color: RED,
      tint: RED,
    },
  },
  {
    trait: "Head",
    match: /crown/i,
    sticker: {
      name: "king",
      caption: "KING",
      effect: "none",
      overlay: "rays",
      motion: "spin",
      color: YELLOW,
      tint: YELLOW,
    },
  },
  {
    trait: "Head",
    match: /wizard/i,
    sticker: {
      name: "magic",
      caption: "MAGIC",
      effect: "none",
      overlay: "sparkles",
      motion: "bounce",
      color: PURPLE,
    },
  },
  {
    trait: "Tier",
    match: /legendary/i,
    sticker: {
      name: "legendary",
      caption: "LEGENDARY",
      effect: "none",
      overlay: "rays",
      motion: "spin",
      color: YELLOW,
      tint: YELLOW,
    },
  },
];

export function getToken(id: number): Token | undefined {
  return BY_ID.get(id);
}

export function stickersFor(token: Token): StickerDef[] {
  const extra: StickerDef[] = [];
  const usedTraits = new Set<string>();
  for (const rule of TRAIT_RULES) {
    if (extra.length >= 3 || usedTraits.has(rule.trait)) continue;
    const value = token.traits[rule.trait];
    if (value && rule.match.test(value)) {
      extra.push(rule.sticker);
      usedTraits.add(rule.trait);
    }
  }
  return [...BASE_STICKERS, ...extra];
}

let font: Font | undefined;
function getFont() {
  if (!font) {
    const buf = readFileSync(
      path.join(process.cwd(), "lib/fonts/Inter-ExtraBold.otf"),
    );
    font = parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  }
  return font;
}

// Glyphs are placed directly: opentype.js 2.0 cannot apply Inter's ccmp lookups.
function captionPath(text: string, size: number) {
  const f = getFont();
  const scale = size / f.unitsPerEm;
  let x = 0;
  let d = "";
  let prev: Glyph | undefined;
  for (const ch of text) {
    const g = f.charToGlyph(ch);
    if (prev) x += f.getKerningValue(prev, g) * scale;
    d += g.getPath(x, 0, size).toPathData(1);
    x += (g.advanceWidth ?? 0) * scale;
    prev = g;
  }
  return { d, width: x, height: size * 0.73 };
}

const artCache = new Map<string, Buffer>();
async function fetchArt(file: string): Promise<Buffer> {
  const hit = artCache.get(file);
  if (hit) return hit;
  let lastErr: unknown;
  for (const gw of GATEWAYS) {
    try {
      const res = await fetch(`${gw}${IMAGE_CID}/${file}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (artCache.size > 200) artCache.clear();
        artCache.set(file, buf);
        return buf;
      }
      lastErr = new Error(`${gw} ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// Scene geometry. The art sits inside a die-cut frame; captions may break out of it.
const W = 600;
const ART = 480;
const AX = 50;
const AY = 40;
const R = 64;
const FRAMES = 12;

async function artDataUri(src: Buffer, effect: Effect): Promise<string> {
  let img = sharp(src);
  if (effect === "zoom")
    img = img.extract({ left: 160, top: 280, width: 720, height: 720 });
  img = img.resize(ART, ART);
  if (effect === "gray") img = img.grayscale().linear(1.25, -20);
  if (effect === "fried")
    img = img
      .modulate({ saturation: 3.4 })
      .linear(1.9, -110)
      .sharpen({ sigma: 2 });
  const jpg = await img.jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${jpg.toString("base64")}`;
}

function rays(rot: number, color: string) {
  const cx = AX + ART / 2;
  const cy = AY + ART / 2;
  let d = "";
  for (let i = 0; i < 16; i += 2) {
    const a1 = ((i * 22.5 + rot) * Math.PI) / 180;
    const a2 = (((i + 1) * 22.5 + rot) * Math.PI) / 180;
    d += `M${cx},${cy}L${cx + 600 * Math.cos(a1)},${cy + 600 * Math.sin(a1)}L${cx + 600 * Math.cos(a2)},${cy + 600 * Math.sin(a2)}Z`;
  }
  return `<path d="${d}" fill="${color}" opacity="0.26"/>`;
}

function speedLines(seed: number) {
  const cx = AX + ART / 2;
  const cy = AY + ART / 2;
  let d = "";
  for (let i = 0; i < 56; i++) {
    const a = ((i * 6.43 + seed * 3.7) * Math.PI) / 180;
    const inner = 150 + ((i * 37 + seed * 23) % 70);
    const w = 3 + ((i * 13 + seed) % 6);
    const ax = Math.cos(a);
    const ay = Math.sin(a);
    const px = -ay * w;
    const py = ax * w;
    d += `M${cx + ax * inner},${cy + ay * inner}L${cx + ax * 420 + px},${cy + ay * 420 + py}L${cx + ax * 420 - px},${cy + ay * 420 - py}Z`;
  }
  return `<path d="${d}" fill="#fff" stroke="${INK}" stroke-width="3" opacity="0.95"/>`;
}

function star(x: number, y: number, s: number, color: string) {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0,-30 C4,-6 6,-4 30,0 C6,4 4,6 0,30 C-4,6 -6,4 -30,0 C-6,-4 -4,-6 0,-30Z" fill="${color}" stroke="${INK}" stroke-width="${4 / Math.max(s, 0.2)}"/>`;
}

function sparkles(t: number) {
  const spots = [
    [AX + 70, AY + 80, 0],
    [AX + ART - 60, AY + 110, 0.33],
    [AX + ART - 100, AY + ART - 170, 0.66],
    [AX + 60, AY + ART - 210, 0.5],
  ];
  return spots
    .map(([x, y, p]) => {
      const s = 0.35 + 0.75 * Math.abs(Math.sin(Math.PI * (t + p)));
      return star(x, y, s, "#fff");
    })
    .join("");
}

function sweat(t: number) {
  const drop = (x: number, y: number, s: number) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0,-34 C14,-12 22,2 22,14 A22,22 0 0 1 -22,14 C-22,2 -14,-12 0,-34Z" fill="#9FD8FF" stroke="${INK}" stroke-width="5"/>`;
  const fall = (t * 60) % 60;
  return (
    drop(AX + ART - 90, AY + 70 + fall, 1.2) +
    drop(AX + ART - 40, AY + 140 + fall * 0.6, 0.8)
  );
}

function captionSvg(def: StickerDef, t: number, motion: Motion) {
  const maxW = def.style === "stamp" ? ART - 60 : ART + 40;
  let size = def.style === "stamp" ? 120 : 132;
  let cap = captionPath(def.caption, size);
  while (cap.width > maxW && size > 44) {
    size -= 6;
    cap = captionPath(def.caption, size);
  }
  const cx = W / 2;

  if (def.style === "stamp") {
    // Rubber stamp slams in over the first third, then holds.
    const k = Math.min(1, t / 0.3);
    const s = 2.6 - 1.6 * (1 - Math.pow(1 - k, 3));
    const op = Math.min(1, 0.25 + k);
    const bw = cap.width + 56;
    const bh = cap.height + 56;
    const cy = AY + ART / 2 + 30;
    return `<g transform="translate(${cx} ${cy}) rotate(-14) scale(${s.toFixed(3)})" opacity="${op.toFixed(2)}">
      <rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="18" fill="none" stroke="${def.color}" stroke-width="12"/>
      <path transform="translate(${-cap.width / 2} ${cap.height / 2})" d="${cap.d}" fill="${def.color}"/>
    </g>`;
  }

  let s = 1;
  let rot = -6;
  if (motion === "punch") s = 1 + 0.14 * Math.abs(Math.sin(Math.PI * 2 * t));
  if (motion === "bounce") s = 1 + 0.06 * Math.abs(Math.sin(Math.PI * 2 * t));
  if (motion === "wobble") rot = -6 - 5 * Math.sin(Math.PI * 2 * t);
  if (motion === "strobe") s = 1 + 0.08 * (Math.floor(t * FRAMES) % 2);
  if (motion === "spin") s = 1 + 0.05 * Math.sin(Math.PI * 2 * t);
  const cy = AY + ART - 46;
  const local = `translate(${-cap.width / 2} ${cap.height / 2})`;
  return `<g transform="translate(${cx} ${cy}) rotate(${rot.toFixed(2)}) scale(${s.toFixed(3)})">
    <path transform="translate(10 10) ${local}" d="${cap.d}" fill="${INK}" stroke="${INK}" stroke-width="26" stroke-linejoin="round"/>
    <path transform="${local}" d="${cap.d}" fill="${def.color}" stroke="${INK}" stroke-width="26" stroke-linejoin="round" paint-order="stroke"/>
    <path transform="${local}" d="${cap.d}" fill="${def.color}"/>
  </g>`;
}

function sceneSvg(def: StickerDef, art: string, t: number): string {
  const m = def.motion;
  let artScale = 1;
  let dx = 0;
  let dy = 0;
  let rot = 0;
  let tintOpacity = 0;

  if (m === "punch") {
    artScale = 1 + 0.16 * Math.abs(Math.sin(Math.PI * 2 * t));
    const i = Math.round(t * FRAMES);
    dx = i % 2 === 0 ? 7 : -7;
    dy = i % 3 === 0 ? -5 : 5;
  }
  if (m === "bounce") dy = -18 * Math.abs(Math.sin(Math.PI * 2 * t));
  if (m === "wobble") rot = 5 * Math.sin(Math.PI * 2 * t);
  if (m === "strobe") {
    const i = Math.round(t * FRAMES);
    dx = i % 2 === 0 ? 9 : -9;
    tintOpacity = i % 2 === 0 ? 0.38 : 0;
    artScale = 1.06;
  }
  if (m === "spin") artScale = 1.03 + 0.03 * Math.sin(Math.PI * 2 * t);
  if (m === "slam") {
    const k = Math.min(1, t / 0.3);
    dx = k < 1 ? 0 : t < 0.42 ? (Math.round(t * 40) % 2 ? 8 : -8) : 0;
  }

  const c = AX + ART / 2;
  const artTransform = `translate(${c + dx} ${AY + ART / 2 + dy}) rotate(${rot.toFixed(2)}) scale(${artScale.toFixed(3)}) translate(${-ART / 2} ${-ART / 2})`;

  let overlay = "";
  if (def.overlay === "rays") overlay = rays(t * 22.5, def.tint ?? YELLOW);
  if (def.overlay === "speed") overlay = speedLines(Math.round(t * FRAMES));
  if (def.overlay === "sparkles") overlay = sparkles(t);
  if (def.overlay === "sweat") overlay = sweat(t);
  const tint =
    def.tint && (m === "strobe" || def.overlay === "sweat")
      ? `<rect x="${AX}" y="${AY}" width="${ART}" height="${ART}" fill="${def.tint}" opacity="${m === "strobe" ? tintOpacity : 0.18}"/>`
      : "";

  return `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs><clipPath id="art"><rect x="${AX}" y="${AY}" width="${ART}" height="${ART}" rx="${R}"/></clipPath></defs>
  <rect x="${AX - 18 + 12}" y="${AY - 18 + 12}" width="${ART + 36}" height="${ART + 36}" rx="${R + 18}" fill="${INK}"/>
  <rect x="${AX - 18}" y="${AY - 18}" width="${ART + 36}" height="${ART + 36}" rx="${R + 18}" fill="#fff" stroke="${INK}" stroke-width="8"/>
  <g clip-path="url(#art)">
    <rect x="${AX}" y="${AY}" width="${ART}" height="${ART}" fill="${INK}"/>
    <image x="0" y="0" width="${ART}" height="${ART}" transform="${artTransform}" href="${art}" xlink:href="${art}"/>
    ${tint}
    ${def.overlay === "rays" || def.overlay === "speed" ? overlay : ""}
  </g>
  ${def.overlay === "sparkles" || def.overlay === "sweat" ? overlay : ""}
  <rect x="${AX}" y="${AY}" width="${ART}" height="${ART}" rx="${R}" fill="none" stroke="${INK}" stroke-width="6"/>
  ${captionSvg(def, t, m)}
</svg>`;
}

// Frame used for the static PNG: the most dramatic moment of each motion.
const KEY_T: Record<Motion, number> = {
  punch: 0.25,
  spin: 0.1,
  slam: 0.9,
  wobble: 0.25,
  bounce: 0.25,
  strobe: 0,
};

export async function renderSticker(
  token: Token,
  def: StickerDef,
): Promise<Buffer> {
  const art = await artDataUri(await fetchArt(token.image), def.effect);
  return sharp(Buffer.from(sceneSvg(def, art, KEY_T[def.motion])))
    .png({ palette: true, quality: 90, effort: 8, compressionLevel: 9 })
    .toBuffer();
}

const GIF_SIZE = 400;

export async function renderStickerGif(
  token: Token,
  def: StickerDef,
): Promise<Buffer> {
  const art = await artDataUri(await fetchArt(token.image), def.effect);
  const frames = await Promise.all(
    Array.from({ length: FRAMES }, (_, i) =>
      sharp(Buffer.from(sceneSvg(def, art, i / FRAMES)))
        .resize(GIF_SIZE, GIF_SIZE)
        .png()
        .toBuffer(),
    ),
  );
  const delay = Array.from({ length: FRAMES }, (_, i) =>
    def.motion === "slam" && i === FRAMES - 1 ? 1400 : 70,
  );
  return sharp(frames, { join: { animated: true } })
    .gif({
      delay,
      loop: 0,
      effort: 7,
      colours: 128,
      dither: 0.6,
      interFrameMaxError: 6,
    })
    .toBuffer();
}
