import { purchaseRepository } from "../infrastructure/purchase.repository";
import { purchaseAuditRepository } from "../infrastructure/audit.repository";
import { receivePurchaseSchema, type ReceivePurchaseInput } from "../validations/purchase.schema";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function receivePurchaseUseCase(
  command: ReceivePurchaseInput,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.receive");
  const input = receivePurchaseSchema.parse(command) as any;

  // 1. Ejecutar RPC atómico que: 
  //    - Actualiza líneas de compra
  //    - Incrementa el inventario
  //    - Actualiza costo promedio (BUG #10 resuelto allí)
  const receiveResult = await purchaseRepository.receive({
    purchase_id: input.purchase_id,
    warehouse_id: input.warehouse_id,
    notes: input.notes,
    items: input.items,
  });

  if (receiveResult.error) {
    throw receiveResult.error;
  }

  const restockOrigin = await purchaseAuditRepository.wasCreatedFromRestock(input.company_id, input.purchase_id);
  await purchaseAuditRepository.record({
    company_id: input.company_id,
    actor_user_id: input.actor_user_id,
    action: "purchase.received",
    entity_id: input.purchase_id,
    new_data: {
      source: restockOrigin.fromRestock ? "inventory.restock_suggestion" : "manual_or_other",
      warehouse_id: input.warehouse_id,
      item_count: input.items.length,
    },
  });

  // 2. Bus Global (BUG #12 Resuelto)
  domainEventBus.publish({
    type: "purchase.received",
    payload: {
      company_id: input.company_id,
      branch_id: input.branch_id,
      warehouse_id: input.warehouse_id,
      purchase_id: input.purchase_id,
      actor_user_id: input.actor_user_id,
      items: input.items,
    },
  });

  return { ok: true, result: receiveResult.data };
}
