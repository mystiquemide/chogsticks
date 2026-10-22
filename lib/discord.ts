import { createPublicKey, verify } from "node:crypto";
import { BASE_STICKERS, getToken, stickersFor, type Token } from "./stickers";

// Discord interaction and response type numbers.
export const InteractionType = {
  PING: 1,
  COMMAND: 2,
  AUTOCOMPLETE: 4,
} as const;
export const ResponseType = {
  PONG: 1,
  MESSAGE: 4,
  AUTOCOMPLETE_RESULT: 8,
} as const;
const EPHEMERAL = 64;

// Ed25519 public keys need a fixed DER prefix before Node can import the raw 32 bytes.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function verifyDiscordSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  publicKeyHex: string,
) {
  if (!signature || !timestamp || !/^[0-9a-f]{128}$/i.test(signature))
    return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([
        ED25519_SPKI_PREFIX,
        Buffer.from(publicKeyHex, "hex"),
      ]),
      format: "der",
      type: "spki",
    });
    return verify(
      null,
      Buffer.from(timestamp + body),
      key,
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export const CHOG_COMMAND = {
  name: "chog",
  description: "Send a Chog sticker. Every send is credited to that Chog.",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      type: 3,
      name: "sticker",
      description: "gm, lfg, ngmi, cope...",
      required: true,
      autocomplete: true,
    },
    {
      type: 4,
      name: "id",
      description: "Chog Genesis token id (1-1969). Random if empty.",
      required: false,
      min_value: 1,
      max_value: 1969,
      autocomplete: true,
    },
  ],
} as const;

type Option = { name: string; value: string | number; focused?: boolean };
export type Interaction = {
  id: string;
  type: number;
  data?: { name?: string; options?: Option[] };
  member?: { user: { id: string } };
  user?: { id: string };
};

export function senderOf(i: Interaction) {
  return i.member?.user.id ?? i.user?.id ?? null;
}

export function option(i: Interaction, name: string) {
  return i.data?.options?.find((o) => o.name === name);
}

const ALL_STICKER_NAMES = Array.from(
  new Set([...BASE_STICKERS.map((s) => s.name)]),
);

export function stickerChoices(query: string, token?: Token) {
  const names = token
    ? stickersFor(token).map((s) => s.name)
    : ALL_STICKER_NAMES;
  const q = query.toLowerCase();
  return names
    .filter((n) => n.includes(q))
    .slice(0, 25)
    .map((n) => ({ name: n, value: n }));
}

export function idChoices(query: string) {
  const q = query.replace(/\D/g, "");
  const out: { name: string; value: number }[] = [];
  for (let id = 1; id <= 1969 && out.length < 25; id++) {
    if (q && !String(id).startsWith(q)) continue;
    const t = getToken(id);
    const flair = t?.traits.Head ?? t?.traits.Eyes ?? t?.traits.Tier ?? "";
    out.push({ name: flair ? `#${id} · ${flair}` : `#${id}`, value: id });
  }
  return out;
}

export function ephemeral(content: string) {
  return { type: ResponseType.MESSAGE, data: { content, flags: EPHEMERAL } };
}

export function stickerMessage(opts: {
  site: string;
  token: Token;
  sticker: string;
  color: string;
  credited: boolean;
  reason?: string;
}) {
  const { site, token, sticker, color, credited, reason } = opts;
  return {
    type: ResponseType.MESSAGE,
    data: {
      embeds: [
        {
          color: parseInt(color.replace("#", ""), 16),
          image: { url: `${site}/api/sticker/${token.id}/${sticker}.gif` },
          footer: {
            text: credited
              ? `Chog #${token.id} credited · chogsticks`
              : reason
                ? `Chog #${token.id} not credited: ${reason} · chogsticks`
                : `Chog #${token.id} · chogsticks`,
          },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: `Whose Chog is #${token.id}?`,
              url: `${site}/chog/${token.id}`,
            },
          ],
        },
      ],
      allowed_mentions: { parse: [] },
    },
  };
}
