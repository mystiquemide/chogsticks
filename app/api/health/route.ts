import { getStore, storeKind } from "@/lib/store";

export async function GET() {
  const started = Date.now();
  try {
    const store = getStore();
    const n = await store.incr("health:pings");
    return Response.json(
      { ok: true, store: storeKind(), pings: n, ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      {
        ok: false,
        store: storeKind(),
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
