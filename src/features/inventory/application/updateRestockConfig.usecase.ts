import { inventoryRepository } from "../infrastructure/inventory.repository";
import { inventoryAuditRepository } from "../infrastructure/audit.repository";
import { restockConfigSchema, type RestockConfigInput } from "../validations/restock.schema";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function updateRestockConfigUseCase(command: RestockConfigInput) {
  const input = restockConfigSchema.parse(command) as any;
  ensureInventoryPermission(input.permissions, "inventory.adjust");

  const result = await inventoryRepository.updateRestockConfig({
    company_id: input.company_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    min_qty: input.min_qty,
    max_qty: input.max_qty,
  });

  if (result.error) throw result.error;

  await inventoryAuditRepository.record({
    company_id: input.company_id,
    branch_id: input.branch_id,
    actor_user_id: input.actor_user_id,
    action: "inventory.restock_config_updated",
    target_id: input.product_id,
    payload: {
      warehouse_id: input.warehouse_id,
      min_qty: input.min_qty,
      max_qty: input.max_qty,
    },
  });

  return { ok: true };
}
