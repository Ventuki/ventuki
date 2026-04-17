import { Inventory } from "../domain/Inventory.entity";
import { stockQuerySchema } from "../validations/stock.schema";
import { inventoryRepository } from "../infrastructure/inventory.repository";
import { inventoryCache } from "../cache/inventory.cache";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function getStockUseCase(query: any) {
  const input = stockQuerySchema.parse(query) as any;
  ensureInventoryPermission(input.permissions, "inventory.view");

  const cacheKey = `${input.company_id}:${input.branch_id || "all"}:${input.warehouse_id || "all"}:${input.search || ""}`;
  const cached = inventoryCache.get(cacheKey);
  if (cached) return cached;

  const response = await inventoryRepository.getStock(input);
  if (response.error) throw response.error;

  const inventory = new Inventory(response.data);
  const data = input.include_cedis ? inventory.cedisStock() : response.data;
  inventoryCache.set(cacheKey, data, 30_000);

  return data;
}
