import { purchaseRepository } from "../infrastructure/purchase.repository";
import { purchaseTransitionSchema, type PurchaseTransitionInput } from "../validations/purchase.schema";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";

export async function cancelPurchaseUseCase(
  command: PurchaseTransitionInput,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.cancel");
  const input = purchaseTransitionSchema.parse(command) as any;

  const result = await purchaseRepository.markCancelled(input.purchase_id, input.company_id);
  if (result.error) throw result.error;

  return { ok: true };
}
