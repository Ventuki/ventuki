export class TTLCache<T> {
  private data = new Map<string, { value: T; expiresAt: number }>();

  get(key: string): T | null {
    const item = this.data.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: T, ttlMs = 60_000) {
    this.data.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(prefix: string) {
    for (const key of this.data.keys()) {
      if (key.startsWith(prefix)) this.data.delete(key);
    }
  }
}
