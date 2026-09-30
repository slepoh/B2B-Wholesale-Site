import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * 缓存后端抽象。
 *
 * 读取优先级：KV（跨请求共享）→ 内存（单请求内去重）→ 回源 D1。
 * 写入 D1 后调用 invalidate() 主动失效，保证后台改动前台立即可见。
 */
export interface CacheBackend {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  invalidate(prefixes: string[]): Promise<void>;
}

const CACHE_PREFIX = 'cache:';

/** 默认 TTL（秒）配置，可按实体类型覆盖 */
export const CACHE_CONFIG = {
  products: 300,
  categories: 600,
  settings: 300,
  translations: 600,
  solutions: 600,
  cases: 600,
  news: 300,
  pages: 600,
  slides: 300,
  seo: 3600,
} as const;

/** 所有需要失效的前缀，用于全局 flush */
export const ALL_CACHE_PREFIXES = [
  'categories',
  'category_slug',
  'category_id',
  'products',
  'product_slug',
  'product_id',
  'settings',
  'setting',
  'translations',
  'solutions',
  'solution_slug',
  'cases',
  'case_slug',
  'news',
  'news_slug',
  'pages',
  'page_slug',
  'slides',
  'jsonld',
  'robots',
  'email_config',
];

/**
 * 无 KV 时的降级实现：仅使用单请求内存缓存。
 * 注意：Cloudflare Workers 每个请求的 isolate 可能不同，内存缓存在此场景下不跨请求，
 * 仅用于降低同一请求内的重复查询。生产环境请务必绑定 KV。
 */
class MemoryCache implements CacheBackend {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async invalidate(prefixes: string[]): Promise<void> {
    for (const key of [...this.store.keys()]) {
      if (prefixes.some((p) => key.startsWith(p))) {
        this.store.delete(key);
      }
    }
  }
}

/** 基于 Cloudflare KV 的缓存实现（推荐，跨请求共享） */
class KVCache implements CacheBackend {
  private memory = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(private kv: KVNamespace) {}

  private k(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    // 同一请求内的极短缓存，避免重复命中 KV
    const local = this.memory.get(key);
    if (local && Date.now() < local.expiresAt) {
      return local.value as T;
    }

    const raw = await this.kv.get(this.k(key), 'text');
    if (raw === null) return null;

    try {
      const parsed = JSON.parse(raw) as T;
      this.memory.set(key, { value: parsed, expiresAt: Date.now() + 1000 });
      return parsed;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    await this.kv.put(this.k(key), JSON.stringify(value), {
      expirationTtl: Math.max(60, ttlSeconds),
    });
  }

  async invalidate(prefixes: string[]): Promise<void> {
    for (const key of [...this.memory.keys()]) {
      if (prefixes.some((p) => key.startsWith(p))) {
        this.memory.delete(key);
      }
    }
    // KV 不支持前缀删除，这里按已知前缀逐一列出并删除匹配的 key。
    // 由于缓存 key 数量可控，使用 list + delete 是可行且准确的。
    for (const prefix of prefixes) {
      let cursor: string | undefined;
      do {
        const listed = await this.kv.list({ prefix: this.k(prefix), cursor });
        await Promise.all(listed.keys.map((k) => this.kv.delete(k.name)));
        cursor = listed.list_complete ? undefined : (listed as any).cursor;
      } while (cursor);
    }
  }
}

export function createCache(kv?: KVNamespace): CacheBackend {
  if (!kv) {
    console.warn(
      '[cache] KV namespace (CACHE) 未绑定，已降级为单请求内存缓存。后台改动不会跨请求即时生效，请在生产环境绑定 KV。'
    );
    return new MemoryCache();
  }
  return new KVCache(kv);
}
