import {
  getToken,
  renderSticker,
  renderStickerGif,
  stickersFor,
} from "@/lib/stickers";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/sticker/[id]/[name]">,
) {
  const { id, name } = await ctx.params;
  const match = /^([a-z-]+)\.(png|gif)$/.exec(name);
  const tokenId = Number(id);
  const token =
    match && Number.isInteger(tokenId) ? getToken(tokenId) : undefined;
  const def = token && stickersFor(token).find((s) => s.name === match![1]);
  if (!token || !def) return new Response("Not found", { status: 404 });
  const gif = match![2] === "gif";

  try {
    const body = gif
      ? await renderStickerGif(token, def)
      : await renderSticker(token, def);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": gif ? "image/gif" : "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Art unavailable, try again", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
