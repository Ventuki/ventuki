import type { TenantContext } from "../../types/sale.types";
import { productRepository } from "../../infrastructure/product.repository";
import { productsCacheLayer } from "../../cache/products.cache";

export async function getProductsQuery(ctx: TenantContext, query: string) {
  const tenantKey = `${ctx.company_id}:${ctx.branch_id}:${ctx.warehouse_id}`;
  const cached = productsCacheLayer.get(tenantKey, query);
  if (cached) return cached;

  const result = await productRepository.searchPOSProducts(ctx, query);
  
  if (result.error) {
    console.error("[getProductsQuery] Error fetching products", result.error);
    throw new Error("No se pudieron consultar productos");
  }

  const rows = (result.data || []) as any[];

  // El mapeo ya viene optimizado desde el RPC
  const mapped = rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: Number(row.price || 0),
    stock: Number(row.stock_available || 0), // Mostramos disponible para la venta
  }));

  productsCacheLayer.set(tenantKey, query, mapped);
  return mapped;
}
