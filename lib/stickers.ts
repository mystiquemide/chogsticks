import { readFileSync } from "node:fs";
import path from "node:path";
import { parse, type Font, type Glyph } from "opentype.js";
import sharp from "sharp";
import tokens from "@/data/tokens.json";

export type Token = { id: number; image: string; traits: Record<string, string> };
type Effect = "none" | "gray" | "tilt" | "zoom" | "fried";
export type StickerDef = { name: string; caption: string; effect: Effect };

const TOKENS = tokens as Token[];
const BY_ID = new Map(TOKENS.map((t) => [t.id, t]));

export const IMAGE_CID = "bafybeihau2egcccbdxymeckmmbrqytbfor5gkt3en6d5fsbueymdbq7g6e";
const GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/"];

export const BASE_STICKERS: StickerDef[] = [
  { name: "gm", caption: "GM", effect: "none" },
  { name: "wagmi", caption: "WAGMI", effect: "none" },
  { name: "ngmi", caption: "NGMI", effect: "gray" },
  { name: "cope", caption: "COPE", effect: "tilt" },
  { name: "lfg", caption: "LFG", effect: "zoom" },
  { name: "chog-on", caption: "CHOG ON", effect: "fried" },
];

// Trait stickers: first match per trait wins, max 3 per token.
const TRAIT_RULES: { trait: string; match: RegExp; sticker: StickerDef }[] = [
  { trait: "Eyes", match: /btc/i, sticker: { name: "number-go-up", caption: "NUMBER GO UP", effect: "none" } },
  { trait: "Eyes", match: /laser/i, sticker: { name: "laser-eyes", caption: "LASER EYES", effect: "zoom" } },
  { trait: "Eyes", match: /^dead$/i, sticker: { name: "im-dead", caption: "IM DEAD", effect: "gray" } },
  { trait: "Eyes", match: /heart/i, sticker: { name: "love-this", caption: "LOVE THIS", effect: "none" } },
  { trait: "Eyes", match: /cry|tear/i, sticker: { name: "sad-boi", caption: "SAD BOI", effect: "gray" } },
  { trait: "Eyes", match: /side eye/i, sticker: { name: "side-eye", caption: "SIDE EYE", effect: "zoom" } },
  { trait: "Mouth", match: /rainbow puke/i, sticker: { name: "sick", caption: "SICK", effect: "fried" } },
  { trait: "Mouth", match: /drool/i, sticker: { name: "want", caption: "WANT", effect: "none" } },
  { trait: "Mouth", match: /gold tooth/i, sticker: { name: "rich", caption: "RICH", effect: "none" } },
  { trait: "Accessory", match: /green candle/i, sticker: { name: "pump-it", caption: "PUMP IT", effect: "none" } },
  { trait: "Accessory", match: /red candle/i, sticker: { name: "dump-it", caption: "DUMP IT", effect: "gray" } },
  { trait: "Accessory", match: /knife/i, sticker: { name: "stabby", caption: "STABBY", effect: "tilt" } },
  { trait: "Head", match: /crown/i, sticker: { name: "king", caption: "KING", effect: "none" } },
  { trait: "Head", match: /wizard/i, sticker: { name: "magic", caption: "MAGIC", effect: "fried" } },
  { trait: "Tier", match: /legendary/i, sticker: { name: "legendary", caption: "LEGENDARY", effect: "none" } },
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
    const buf = readFileSync(path.join(process.cwd(), "lib/fonts/Inter-ExtraBold.otf"));
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
    d += g.getPath(x, 0, size).toPathData(2);
    x += (g.advanceWidth ?? 0) * scale;
    prev = g;
  }
  return { d, width: x };
}

const artCache = new Map<string, Buffer>();
async function fetchArt(file: string): Promise<Buffer> {
  const hit = artCache.get(file);
  if (hit) return hit;
  let lastErr: unknown;
  for (const gw of GATEWAYS) {
    try {
      const res = await fetch(`${gw}${IMAGE_CID}/${file}`, { signal: AbortSignal.timeout(15000) });
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

const ART = 512;
const PAD = 22;
const SHADOW = 12;
const CANVAS = ART + PAD * 2 + SHADOW;
const INK = "#141014";

function roundedMask(size: number, r: number) {
  return Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`);
}

async function artLayer(src: Buffer, effect: Effect): Promise<Buffer> {
  let img = sharp(src);
  if (effect === "zoom") img = img.extract({ left: 180, top: 300, width: 700, height: 700 });
  img = img.resize(ART, ART);
  if (effect === "gray") img = img.grayscale();
  if (effect === "fried") img = img.modulate({ saturation: 3.2 }).linear(1.8, -100).sharpen();
  let out = await img.composite([{ input: roundedMask(ART, 72), blend: "dest-in" }]).png().toBuffer();
  if (effect === "tilt") {
    const big = Math.round(ART * 1.3);
    const rotated = await sharp(src).resize(big, big).rotate(-8, { background: "#000" }).png().toBuffer();
    const meta = await sharp(rotated).metadata();
    const off = Math.round(((meta.width ?? big) - ART) / 2);
    out = await sharp(rotated)
      .extract({ left: off, top: off, width: ART, height: ART })
      .composite([{ input: roundedMask(ART, 72), blend: "dest-in" }])
      .png()
      .toBuffer();
  }
  return out;
}

export async function renderSticker(token: Token, def: StickerDef): Promise<Buffer> {
  const art = await artLayer(await fetchArt(token.image), def.effect);

  let size = 110;
  let cap = captionPath(def.caption, size);
  while (cap.width > ART - 40 && size > 40) {
    size -= 6;
    cap = captionPath(def.caption, size);
  }
  const capX = PAD + (ART - cap.width) / 2;
  const capY = PAD + ART - 40;

  const frame = `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${SHADOW}" y="${SHADOW}" width="${ART + PAD * 2}" height="${ART + PAD * 2}" rx="90" fill="${INK}"/>
    <rect x="4" y="4" width="${ART + PAD * 2 - 8}" height="${ART + PAD * 2 - 8}" rx="88" fill="#fff" stroke="${INK}" stroke-width="8"/>
  </svg>`;
  const caption = `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${capX.toFixed(1)} ${capY})">
      <path d="${cap.d}" fill="#fff" stroke="${INK}" stroke-width="24" stroke-linejoin="round" paint-order="stroke"/>
      <path d="${cap.d}" fill="#fff"/>
    </g>
  </svg>`;

  return sharp(Buffer.from(frame))
    .composite([
      { input: art, left: PAD, top: PAD },
      { input: Buffer.from(caption), left: 0, top: 0 },
    ])
    .png({ palette: true, quality: 90, effort: 8, compressionLevel: 9 })
    .toBuffer();
}
