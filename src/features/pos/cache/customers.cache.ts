import { MemoryCache } from "./memory.cache";

export interface CachedCustomer {
  id: string;
  full_name: string;
  tax_id?: string;
}

const customersCache = new MemoryCache<CachedCustomer[]>(60_000);

export const customersCacheLayer = {
  get: (tenantKey: string, query: string) => customersCache.get(`${tenantKey}:${query}`),
  set: (tenantKey: string, query: string, value: CachedCustomer[]) => customersCache.set(`${tenantKey}:${query}`, value),
  clearTenant: (tenantKey: string) => customersCache.clear(`${tenantKey}:`),
};
