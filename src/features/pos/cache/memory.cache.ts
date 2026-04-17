export class MemoryCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly ttlMs = 30_000) {}

  get(key: string): T | null {
    const cached = this.store.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return cached.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(prefix?: string) {
    if (!prefix) return this.store.clear();
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}
