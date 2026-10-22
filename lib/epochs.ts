import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type EpochFile = {
  epoch: number;
  closedAt: number;
  root: `0x${string}`;
  total: string;
  rows: {
    tokenId: number;
    score: number;
    sends: number;
    people: number;
    amount: string;
    proof: `0x${string}`[];
  }[];
};

export function readEpoch(epoch: number): EpochFile | null {
  const file = path.join(process.cwd(), "data/epochs", `${epoch}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as EpochFile;
}
