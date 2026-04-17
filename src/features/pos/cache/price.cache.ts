import type { ProductDetail } from "../infrastructure/product.repository";
import { MemoryCache } from "./memory.cache";

// Cache individual de precio (legacy, mantiene compatibilidad)
const priceCache = new MemoryCache<number>(60_000);

// Cache completo del ProductDetail (nombre, SKU, precio, IVA, descuento máx)
const detailCache = new MemoryCache<ProductDetail>(60_000);

export const priceCacheLayer = {
  // --- Legacy: price only ---
  get: (tenantKey: string, productId: string) => priceCache.get(`${tenantKey}:${productId}`),
  set: (tenantKey: string, productId: string, price: number) =>
    priceCache.set(`${tenantKey}:${productId}`, price),
  clearTenant: (tenantKey: string) => priceCache.clear(`${tenantKey}:`),

  // --- New: full product detail ---
  getDetail: (tenantKey: string, productId: string): ProductDetail | null =>
    detailCache.get(`${tenantKey}:${productId}`),
  setDetail: (tenantKey: string, productId: string, detail: ProductDetail) => {
    detailCache.set(`${tenantKey}:${productId}`, detail);
    // Sincronizar cache legacy de precio
    priceCache.set(`${tenantKey}:${productId}`, detail.price);
  },
  clearDetailTenant: (tenantKey: string) => detailCache.clear(`${tenantKey}:`),

  /** Invalida todo el caché de una empresa (precio + detalle) */
  invalidateCompany: (companyId: string) => {
    priceCache.clear(`${companyId}:`);
    detailCache.clear(`${companyId}:`);
  },
};

