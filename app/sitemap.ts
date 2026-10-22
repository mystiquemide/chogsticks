import type { MetadataRoute } from "next";

const BASE = "https://chogsticks.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/try", "/leaderboard", "/pool"].map((p) => ({ url: BASE + p }));
}
