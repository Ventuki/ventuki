import type { StockReleasedEvent } from "../events/StockReleased.event";
import { reserveSchema } from "../validations/stock.schema";
import { inventoryRepository } from "../infrastructure/inventory.repository";
import { movementRepository } from "../infrastructure/movement.repository";
import { inventoryAuditRepository } from "../infrastructure/audit.repository";
import { inventoryEventBus } from "../infrastructure/event-bus";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function releaseStockUseCase(command: any) {
  const input = reserveSchema.parse(command) as any;
  ensureInventoryPermission(input.permissions, "inventory.adjust");

  const releaseRes = await inventoryRepository.adjustReserved({
    company_id: input.company_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    delta_reserved: -Math.abs(input.qty),
    notes: input.notes,
  });
  if (releaseRes.error) throw releaseRes.error;

  await movementRepository.create({
    company_id: input.company_id,
    branch_id: input.branch_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    qty: input.qty,
    type: "release",
    actor_user_id: input.actor_user_id,
  });

  await inventoryAuditRepository.record({
    company_id: input.company_id,
    branch_id: input.branch_id,
    actor_user_id: input.actor_user_id,
    action: "inventory.released",
    payload: input,
  });

  const event: StockReleasedEvent = {
    name: "inventory.stock.released",
    payload: input,
  };
  inventoryEventBus.publish(event);

  return { ok: true };
}
