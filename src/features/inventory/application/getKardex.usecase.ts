import { movementRepository } from "../infrastructure/movement.repository";
import { kardexCache } from "../cache/kardex.cache";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function getKardexUseCase(query: {
  company_id: string;
  warehouse_id?: string;
  product_id?: string;
  permissions: Array<"inventory.view" | "inventory.adjust" | "inventory.transfer" | "inventory.kardex">;
}) {
  ensureInventoryPermission(query.permissions, "inventory.kardex");
  const cacheKey = `${query.company_id}:${query.warehouse_id || "all"}:${query.product_id || "all"}`;
  const cached = kardexCache.get(cacheKey);
  if (cached) return cached;

  const response = await movementRepository.getKardex(query);
  if (response.error) throw response.error;

  kardexCache.set(cacheKey, response.data, 20_000);
  return response.data;
}
