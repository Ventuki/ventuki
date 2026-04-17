import type { StockReservedEvent } from "../events/StockReserved.event";
import { reserveSchema } from "../validations/stock.schema";
import { inventoryRepository } from "../infrastructure/inventory.repository";
import { movementRepository } from "../infrastructure/movement.repository";
import { inventoryAuditRepository } from "../infrastructure/audit.repository";
import { inventoryEventBus } from "../infrastructure/event-bus";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function reserveStockUseCase(command: any) {
  const input = reserveSchema.parse(command) as any;
  ensureInventoryPermission(input.permissions, "inventory.adjust");

  const current = await inventoryRepository.getByProductAndWarehouse(input.company_id, input.product_id, input.warehouse_id);
  if (current.error) throw current.error;
  if (!current.data || current.data.qty < input.qty) throw new Error("stock insuficiente para reserva");

  const reserveRes = await inventoryRepository.adjustReserved({
    company_id: input.company_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    delta_reserved: Math.abs(input.qty),
    notes: input.notes,
  });
  if (reserveRes.error) throw reserveRes.error;

  await movementRepository.create({
    company_id: input.company_id,
    branch_id: input.branch_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    qty: input.qty,
    type: "reserve",
    actor_user_id: input.actor_user_id,
  });

  await inventoryAuditRepository.record({
    company_id: input.company_id,
    branch_id: input.branch_id,
    actor_user_id: input.actor_user_id,
    action: "inventory.reserved",
    payload: input,
  });

  const event: StockReservedEvent = {
    name: "inventory.stock.reserved",
    payload: input,
  };
  inventoryEventBus.publish(event);

  return { ok: true };
}
