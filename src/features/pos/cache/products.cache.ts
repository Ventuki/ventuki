import { MemoryCache } from "./memory.cache";

export interface CachedProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

const productsCache = new MemoryCache<CachedProduct[]>(20_000);

export const productsCacheLayer = {
  get: (tenantKey: string, query: string) => productsCache.get(`${tenantKey}:${query}`),
  set: (tenantKey: string, query: string, value: CachedProduct[]) => productsCache.set(`${tenantKey}:${query}`, value),
  clearTenant: (tenantKey: string) => productsCache.clear(`${tenantKey}:`),
};
