import { getToken, stickersFor } from "@/lib/stickers";

export async function GET(_req: Request, ctx: RouteContext<"/api/stickers/[id]">) {
  const { id } = await ctx.params;
  const token = getToken(Number(id));
  if (!token) return Response.json({ error: "Unknown token" }, { status: 404 });
  return Response.json({
    id: token.id,
    traits: token.traits,
    stickers: stickersFor(token).map((s) => ({ name: s.name, caption: s.caption, url: `/api/sticker/${token.id}/${s.name}.png` })),
  });
}
