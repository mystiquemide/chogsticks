import { Redis } from "@upstash/redis";

// The subset of Redis that Chogsticks uses. Upstash in production, memory in tests and local runs.
export interface Store {
  incr(key: string, ttlSec?: number): Promise<number>;
  setNX(key: string, value: string, ttlSec: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  zincrby(key: string, by: number, member: string): Promise<number>;
  ztop(key: string, count: number): Promise<{ member: string; score: number }[]>;
  zscore(key: string, member: string): Promise<number | null>;
  sadd(key: string, member: string): Promise<number>;
  scard(key: string): Promise<number>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  hgetall(key: string): Promise<Record<string, number>>;
}

class UpstashStore implements Store {
  constructor(private r: Redis) {}

  async incr(key: string, ttlSec?: number) {
    const n = await this.r.incr(key);
    if (ttlSec && n === 1) await this.r.expire(key, ttlSec);
    return n;
  }
  async setNX(key: string, value: string, ttlSec: number) {
    return (await this.r.set(key, value, { nx: true, ex: ttlSec })) === "OK";
  }
  async get(key: string) {
    const v = await this.r.get<string | number>(key);
    return v === null ? null : String(v);
  }
  async set(key: string, value: string) {
    await this.r.set(key, value);
  }
  zincrby(key: string, by: number, member: string) {
    return this.r.zincrby(key, by, member);
  }
  async ztop(key: string, count: number) {
    const flat = await this.r.zrange<(string | number)[]>(key, 0, count - 1, { rev: true, withScores: true });
    const out: { member: string; score: number }[] = [];
    for (let i = 0; i < flat.length; i += 2) out.push({ member: String(flat[i]), score: Number(flat[i + 1]) });
    return out;
  }
  zscore(key: string, member: string) {
    return this.r.zscore(key, member);
  }
  sadd(key: string, member: string) {
    return this.r.sadd(key, member);
  }
  scard(key: string) {
    return this.r.scard(key);
  }
  hincrby(key: string, field: string, by: number) {
    return this.r.hincrby(key, field, by);
  }
  async hgetall(key: string) {
    const h = (await this.r.hgetall<Record<string, number | string>>(key)) ?? {};
    return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v)]));
  }
}

// TTLs are ignored in memory: the process is short-lived.
export class MemoryStore implements Store {
  private kv = new Map<string, string>();
  private z = new Map<string, Map<string, number>>();
  private s = new Map<string, Set<string>>();
  private h = new Map<string, Map<string, number>>();

  async incr(key: string) {
    const n = Number(this.kv.get(key) ?? 0) + 1;
    this.kv.set(key, String(n));
    return n;
  }
  async setNX(key: string, value: string) {
    if (this.kv.has(key)) return false;
    this.kv.set(key, value);
    return true;
  }
  async get(key: string) {
    return this.kv.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.kv.set(key, value);
  }
  async zincrby(key: string, by: number, member: string) {
    const z = this.z.get(key) ?? new Map<string, number>();
    const v = (z.get(member) ?? 0) + by;
    z.set(member, v);
    this.z.set(key, z);
    return v;
  }
  async ztop(key: string, count: number) {
    return [...(this.z.get(key) ?? new Map<string, number>())]
      .map(([member, score]) => ({ member, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
  async zscore(key: string, member: string) {
    return this.z.get(key)?.get(member) ?? null;
  }
  async sadd(key: string, member: string) {
    const s = this.s.get(key) ?? new Set<string>();
    const had = s.has(member);
    s.add(member);
    this.s.set(key, s);
    return had ? 0 : 1;
  }
  async scard(key: string) {
    return this.s.get(key)?.size ?? 0;
  }
  async hincrby(key: string, field: string, by: number) {
    const h = this.h.get(key) ?? new Map<string, number>();
    const v = (h.get(field) ?? 0) + by;
    h.set(field, v);
    this.h.set(key, h);
    return v;
  }
  async hgetall(key: string) {
    return Object.fromEntries(this.h.get(key) ?? []);
  }
}

let store: Store | undefined;

export function getStore(): Store {
  if (!store) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    store = url && token ? new UpstashStore(new Redis({ url, token })) : new MemoryStore();
  }
  return store;
}

export function storeKind(): "upstash" | "memory" {
  return getStore() instanceof MemoryStore ? "memory" : "upstash";
}
