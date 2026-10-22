// Builds the payout for a closed epoch and writes data/epochs/<epoch>.json.
// Usage: tsx scripts/epoch.ts <epoch> <budgetInChog>
// Reads scores from the live site's admin endpoint (ADMIN_SECRET), so it runs anywhere.
import { writeFileSync } from "node:fs";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { parseUnits } from "viem";

async function main() {
  const epoch = Number(process.argv[2]);
  const budget = parseUnits(process.argv[3] ?? "0", 18);
  const site = process.env.SITE_URL ?? "https://chogsticks.vercel.app";
  if (!Number.isInteger(epoch) || budget <= 0n)
    throw new Error("Usage: epoch.ts <epoch> <budgetInChog>");

  const res = await fetch(`${site}/api/admin/epoch/${epoch}`, {
    headers: { authorization: `Bearer ${process.env.ADMIN_SECRET}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { closedAt, rows } = (await res.json()) as {
    closedAt: number;
    rows: { tokenId: number; score: number; sends: number; people: number }[];
  };
  if (rows.length === 0) throw new Error("No credited sends in this epoch");

  // Integer math on scores scaled to 1e6 so shares never exceed the budget.
  const scaled = rows.map((r) => BigInt(Math.round(r.score * 1e6)));
  const totalScore = scaled.reduce((a, b) => a + b, 0n);
  const amounts = scaled.map((s) => (budget * s) / totalScore);
  const total = amounts.reduce((a, b) => a + b, 0n);

  const tree = StandardMerkleTree.of(
    rows.map((r, i) => [BigInt(epoch), BigInt(r.tokenId), amounts[i]]),
    ["uint256", "uint256", "uint256"],
  );
  const out = {
    epoch,
    closedAt,
    root: tree.root,
    total: total.toString(),
    rows: rows.map((r, i) => ({
      ...r,
      amount: amounts[i].toString(),
      proof: tree.getProof(i),
    })),
  };
  writeFileSync(
    `data/epochs/${epoch}.json`,
    JSON.stringify(out, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      epoch,
      root: tree.root,
      total: total.toString(),
      chogs: rows.length,
    }),
  );
}

main();
