import type { MetadataRoute } from "next";

const BASE = "https://chogsticks.midelabs.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/try", "/leaderboard", "/pool", "/my"].map((p) => ({ url: BASE + p }));
}
