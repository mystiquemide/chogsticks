import { readEpoch } from "@/lib/epochs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/proof/[epoch]/[id]">,
) {
  const { epoch, id } = await ctx.params;
  const data = readEpoch(Number(epoch));
  if (!data)
    return Response.json({ error: "Epoch not posted" }, { status: 404 });
  const row = data.rows.find((r) => r.tokenId === Number(id));
  if (!row)
    return Response.json(
      { error: "No allocation for this Chog in this epoch" },
      { status: 404 },
    );
  return Response.json({
    epoch: data.epoch,
    tokenId: row.tokenId,
    amount: row.amount,
    proof: row.proof,
    root: data.root,
  });
}
