import { getToken, renderSticker, stickersFor } from "@/lib/stickers";

export async function GET(_req: Request, ctx: RouteContext<"/api/sticker/[id]/[name]">) {
  const { id, name } = await ctx.params;
  const tokenId = Number(id);
  const stickerName = name.replace(/\.png$/, "");
  const token = Number.isInteger(tokenId) ? getToken(tokenId) : undefined;
  const def = token && stickersFor(token).find((s) => s.name === stickerName);
  if (!token || !def) return new Response("Not found", { status: 404 });

  try {
    const png = await renderSticker(token, def);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Art unavailable, try again", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
