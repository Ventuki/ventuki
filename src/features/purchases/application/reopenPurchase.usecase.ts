import { purchaseRepository } from "../infrastructure/purchase.repository";
import { purchaseAuditRepository } from "../infrastructure/audit.repository";
import { purchaseTransitionSchema, type PurchaseTransitionInput } from "../validations/purchase.schema";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";

export async function reopenPurchaseUseCase(
  command: PurchaseTransitionInput,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.reopen");
  const input = purchaseTransitionSchema.parse(command) as any;

  const result = await purchaseRepository.markDraft(input.purchase_id, input.company_id);
  if (result.error) throw result.error;

  const restockOrigin = await purchaseAuditRepository.wasCreatedFromRestock(input.company_id, input.purchase_id);
  await purchaseAuditRepository.record({
    company_id: input.company_id,
    action: "purchase.reopened",
    entity_id: input.purchase_id,
    new_data: {
      source: restockOrigin.fromRestock ? "inventory.restock_suggestion" : "manual_or_other",
    },
  });

  return { ok: true };
}
