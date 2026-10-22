import {
  ephemeral,
  idChoices,
  type Interaction,
  InteractionType,
  option,
  ResponseType,
  senderOf,
  stickerChoices,
  stickerMessage,
  verifyDiscordSignature,
} from "@/lib/discord";
import { recordSend } from "@/lib/scoring";
import { getToken, stickersFor } from "@/lib/stickers";
import { getStore } from "@/lib/store";

function siteUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const UNCREDITED = {
  "new-account": "account under 30 days old",
  "self-send": "holders can't credit their own Chog",
  "daily-cap": "you hit 5 sends of this Chog today",
} as const;

export async function POST(req: Request) {
  const publicKey = process.env.CHOGSTICKS_Public_Key;
  const body = await req.text();
  if (
    !publicKey ||
    !verifyDiscordSignature(
      body,
      req.headers.get("x-signature-ed25519"),
      req.headers.get("x-signature-timestamp"),
      publicKey,
    )
  ) {
    return new Response("Bad signature", { status: 401 });
  }

  const i = JSON.parse(body) as Interaction;

  if (i.type === InteractionType.PING)
    return Response.json({ type: ResponseType.PONG });

  if (i.type === InteractionType.AUTOCOMPLETE) {
    const focused = i.data?.options?.find((o) => o.focused);
    const idOpt = option(i, "id");
    const token =
      idOpt && !idOpt.focused ? getToken(Number(idOpt.value)) : undefined;
    const choices =
      focused?.name === "id"
        ? idChoices(String(focused.value))
        : stickerChoices(String(focused?.value ?? ""), token);
    return Response.json({
      type: ResponseType.AUTOCOMPLETE_RESULT,
      data: { choices },
    });
  }

  if (i.type === InteractionType.COMMAND && i.data?.name === "chog") {
    const sender = senderOf(i);
    if (!sender)
      return Response.json(
        ephemeral("Discord didn't say who sent this. Try /chog again."),
      );

    const idOpt = option(i, "id");
    const tokenId = idOpt
      ? Number(idOpt.value)
      : 1 + Math.floor(Math.random() * 1969);
    const token = getToken(tokenId);
    if (!token)
      return Response.json(
        ephemeral(`Chog #${tokenId} doesn't exist. Ids run 1 to 1969.`),
      );

    const name = String(option(i, "sticker")?.value ?? "").toLowerCase();
    const def = stickersFor(token).find((s) => s.name === name);
    if (!def) {
      const list = stickersFor(token)
        .map((s) => s.name)
        .join(", ");
      return Response.json(
        ephemeral(
          `Chog #${token.id} has no \"${name}\" sticker. Its pack: ${list}`,
        ),
      );
    }

    const result = await recordSend(getStore(), {
      interactionId: i.id,
      tokenId: token.id,
      senderId: sender,
      nowMs: Date.now(),
    });
    return Response.json(
      stickerMessage({
        site: siteUrl(req),
        token,
        sticker: def.name,
        color: def.color,
        credited: result.status === "counted",
        reason:
          result.status === "uncredited"
            ? UNCREDITED[result.reason]
            : result.status === "duplicate"
              ? "already counted"
              : undefined,
      }),
    );
  }

  return Response.json(
    ephemeral("Chogsticks only knows /chog. Try /chog sticker:gm."),
  );
}
