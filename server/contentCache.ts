interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

export class ContentCacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Generates a stable key from an object or string
   */
  public makeKey(prefix: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(k => `${k}:${JSON.stringify(params[k])}`)
      .join('|');
    return `${prefix}:${sorted}`;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    const now = Date.now();
    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000
    });

    // Prevent runaway in-memory growth
    if (this.cache.size > 2000) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 500);
      for (const k of oldestKeys) {
        this.cache.delete(k);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const contentCache = new ContentCacheManager();
