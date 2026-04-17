import { Transfer } from "../domain/Transfer.entity";
import type { StockTransferredEvent } from "../events/StockTransferred.event";
import { inventoryCache } from "../cache/inventory.cache";
import { transferSchema, type TransferInput } from "../validations/transfer.schema";
import { inventoryRepository } from "../infrastructure/inventory.repository";
import { movementRepository } from "../infrastructure/movement.repository";
import { transferRepository } from "../infrastructure/transfer.repository";
import { warehouseRepository } from "../infrastructure/warehouse.repository";
import { inventoryAuditRepository } from "../infrastructure/audit.repository";
import { inventoryLogger } from "../infrastructure/logger";
import { inventoryEventBus } from "../infrastructure/event-bus";
import { ensureInventoryPermission } from "./security/rbac.service";

export async function transferStockUseCase(command: TransferInput) {
  const input = transferSchema.parse(command) as any;
  ensureInventoryPermission(input.permissions, "inventory.transfer");
  new Transfer(input.from_warehouse, input.to_warehouse, input.qty);

  const [fromWarehouse, toWarehouse] = await Promise.all([
    warehouseRepository.exists(input.company_id, input.from_warehouse),
    warehouseRepository.exists(input.company_id, input.to_warehouse),
  ]);

  if (fromWarehouse.error || !fromWarehouse.exists) {
    inventoryLogger.error("almacén inválido", { warehouse: input.from_warehouse });
    throw new Error("validar almacén origen");
  }

  if (toWarehouse.error || !toWarehouse.exists) {
    inventoryLogger.error("almacén inválido", { warehouse: input.to_warehouse });
    throw new Error("validar almacén destino");
  }

  const originStock = await inventoryRepository.getByProductAndWarehouse(input.company_id, input.product_id, input.from_warehouse);
  if (originStock.error) throw originStock.error;
  if ((originStock.data?.qty || 0) < input.qty) {
    inventoryLogger.error("transferencia inválida", { origin: originStock.data, input });
    throw new Error("stock insuficiente en origen");
  }

  // Transferencia atómica (RPC)
  const transferRpcRes = await inventoryRepository.transferStock({
    company_id: input.company_id,
    from_warehouse_id: input.from_warehouse,
    to_warehouse_id: input.to_warehouse,
    product_id: input.product_id,
    quantity: input.qty,
    notes: input.notes,
  });

  if (transferRpcRes.error) {
    inventoryLogger.error("fallo transferencia RPC", { input, error: transferRpcRes.error });
    throw transferRpcRes.error;
  }

  const transferRes = await transferRepository.create({
    company_id: input.company_id,
    branch_id: input.branch_id,
    from_warehouse: input.from_warehouse,
    to_warehouse: input.to_warehouse,
    product_id: input.product_id,
    qty: input.qty,
    notes: input.notes,
    actor_user_id: input.actor_user_id,
  });

  const reference = transferRes.data?.id;

  await inventoryAuditRepository.record({
    company_id: input.company_id,
    branch_id: input.branch_id,
    actor_user_id: input.actor_user_id,
    action: "inventory.transferred",
    target_id: reference,
    payload: input,
  });

  inventoryCache.invalidate(`${input.company_id}:`);

  const event: StockTransferredEvent = {
    name: "inventory.stock.transferred",
    payload: {
      company_id: input.company_id,
      branch_id: input.branch_id,
      from_warehouse: input.from_warehouse,
      to_warehouse: input.to_warehouse,
      product_id: input.product_id,
      qty: input.qty,
      actor_user_id: input.actor_user_id,
    },
  };
  inventoryEventBus.publish(event);

  return { ok: true, transfer: transferRes.data };
}
