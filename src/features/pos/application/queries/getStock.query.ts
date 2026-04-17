import type { TenantContext } from "../../types/sale.types";
import { inventoryRepository } from "../../infrastructure/inventory.repository";

export async function getStockQuery(ctx: TenantContext, product_id: string) {
  const result = await inventoryRepository.getStock(ctx, product_id);
  return Number((result.data as any)?.quantity || 0);
}
