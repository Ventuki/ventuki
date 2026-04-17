import { Stock } from "../domain/Stock.entity";
import type { StockAdjustedEvent } from "../events/StockAdjusted.event";
import { stockCache } from "../cache/stock.cache";
import { inventoryCache } from "../cache/inventory.cache";
import { adjustSchema, type AdjustInput } from "../validations/adjust.schema";
import { inventoryRepository } from "../infrastructure/inventory.repository";
import { movementRepository } from "../infrastructure/movement.repository";
import { inventoryAuditRepository } from "../infrastructure/audit.repository";
import { inventoryLogger } from "../infrastructure/logger";
import { inventoryEventBus } from "../infrastructure/event-bus";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function adjustStockUseCase(command: AdjustInput) {
  const input = adjustSchema.parse(command) as any;
  ensureInventoryPermission(input.permissions, "inventory.adjust");

  const stockRes = await inventoryRepository.getByProductAndWarehouse(input.company_id, input.product_id, input.warehouse_id);
  if (stockRes.error) throw stockRes.error;

  const stock = new Stock(stockRes.data?.qty || 0, stockRes.data?.reserved_qty || 0, stockRes.data?.min_qty || 0, stockRes.data?.max_qty || null);
  try {
    stock.adjust(input.delta);
  } catch (error) {
    inventoryLogger.error("stock negativo", { input, error });
    throw error;
  }

  const movementType = input.delta > 0 ? "adjustment_in" : "adjustment_out";
  const adjustRes = await inventoryRepository.adjustStock({
    company_id: input.company_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    delta: input.delta,
    movement_type: movementType,
    notes: input.notes,
  });
  if (adjustRes.error) throw adjustRes.error;

  await movementRepository.create({
    company_id: input.company_id,
    branch_id: input.branch_id,
    warehouse_id: input.warehouse_id,
    product_id: input.product_id,
    qty: Math.abs(input.delta),
    type: movementType,
    notes: input.notes,
    actor_user_id: input.actor_user_id,
  });

  await inventoryAuditRepository.record({
    company_id: input.company_id,
    branch_id: input.branch_id,
    actor_user_id: input.actor_user_id,
    action: "inventory.adjusted",
    payload: input,
  });

  inventoryCache.invalidate(`${input.company_id}:`);
  stockCache.invalidate(`${input.company_id}:${input.warehouse_id}:${input.product_id}`);

  const event: StockAdjustedEvent = {
    name: "inventory.stock.adjusted",
    payload: {
      company_id: input.company_id,
      branch_id: input.branch_id,
      warehouse_id: input.warehouse_id,
      product_id: input.product_id,
      delta: input.delta,
      actor_user_id: input.actor_user_id,
      notes: input.notes,
    },
  };
  inventoryEventBus.publish(event);

  return { ok: true };
}
