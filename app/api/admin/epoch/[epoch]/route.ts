import { timingSafeEqual } from "node:crypto";
import { epochEnd, keys } from "@/lib/scoring";
import { getStore } from "@/lib/store";

// Scores for a closed epoch. Used by scripts/epoch.ts to build the payout tree.
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/admin/epoch/[epoch]">,
) {
  const secret = process.env.ADMIN_SECRET ?? "";
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (
    !secret ||
    given.length !== secret.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(secret))
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  const epoch = Number((await ctx.params).epoch);
  if (!Number.isInteger(epoch) || epoch < 0)
    return Response.json({ error: "Bad epoch" }, { status: 400 });
  if (Date.now() < epochEnd(epoch))
    return Response.json(
      { error: "Epoch still open", closesAt: epochEnd(epoch) },
      { status: 409 },
    );

  const store = getStore();
  const rows = await store.ztop(keys.leaderboard(epoch), 2000);
  const withSends = await Promise.all(
    rows.map(async (r) => ({
      tokenId: Number(r.member),
      score: r.score,
      sends: Number((await store.get(keys.raw(epoch, Number(r.member)))) ?? 0),
      people: await store.scard(keys.unique(epoch, Number(r.member))),
    })),
  );
  return Response.json(
    { epoch, closedAt: epochEnd(epoch), rows: withSends },
    { headers: { "Cache-Control": "no-store" } },
  );
}
