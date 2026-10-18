// Builds data/tokens.json: every Chog Genesis token id with its image file and traits.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CHOG_NFT, CHOG_SUPPLY, erc721Abi, publicClient } from "../lib/chain";

const OUT = "data/tokens.json";
const GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/", "https://dweb.link/ipfs/"];

type Token = { id: number; image: string; traits: Record<string, string> };

async function fetchJson(ipfs: string): Promise<{ image: string; attributes: { trait_type: string; value: string }[] }> {
  const path = ipfs.replace("ipfs://", "");
  let lastErr: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    const gw = GATEWAYS[attempt % GATEWAYS.length];
    try {
      const res = await fetch(gw + path, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return await res.json();
      lastErr = new Error(`${res.status} ${gw}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  throw lastErr;
}

async function main() {
  const done: Record<number, Token> = existsSync(OUT)
    ? Object.fromEntries((JSON.parse(readFileSync(OUT, "utf8")) as Token[]).map((t) => [t.id, t]))
    : {};
  const ids = Array.from({ length: CHOG_SUPPLY }, (_, i) => i + 1).filter((id) => !done[id]);
  console.log(`indexing ${ids.length} tokens`);

  const uris = await publicClient.multicall({
    contracts: ids.map((id) => ({ address: CHOG_NFT, abi: erc721Abi, functionName: "tokenURI", args: [BigInt(id)] })),
    allowFailure: true,
    batchSize: 4096,
  });

  let next = 0;
  const failed: number[] = [];
  async function worker() {
    while (next < ids.length) {
      const i = next++;
      const id = ids[i];
      const r = uris[i];
      if (r.status !== "success") {
        failed.push(id);
        continue;
      }
      try {
        const meta = await fetchJson(r.result as string);
        done[id] = {
          id,
          image: meta.image.split("/").pop()!,
          traits: Object.fromEntries(meta.attributes.map((a) => [a.trait_type, String(a.value)])),
        };
      } catch {
        failed.push(id);
      }
      if (Object.keys(done).length % 100 === 0) save(done);
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  save(done);
  console.log(`indexed ${Object.keys(done).length}/${CHOG_SUPPLY}, failed ${failed.length}`, failed.slice(0, 20));
}

function save(done: Record<number, Token>) {
  const list = Object.values(done).sort((a, b) => a.id - b.id);
  writeFileSync(OUT, JSON.stringify(list));
}

main();
