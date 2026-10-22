// Pages that exist. Links to anything else stay hidden until the page ships.
export const LIVE_PAGES = new Set<string>(["/", "/try"]);

export function isLive(href: string) {
  return LIVE_PAGES.has(href);
}
