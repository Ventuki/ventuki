import { purchaseRepository } from "../infrastructure/purchase.repository";
import { purchaseDraftDetailSchema, type PurchaseDraftDetailInput } from "../validations/purchase.schema";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";

export async function getPurchaseDraftDetailUseCase(
  command: PurchaseDraftDetailInput,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.view");
  const input = purchaseDraftDetailSchema.parse(command) as any;

  const result = await purchaseRepository.getDraftDetail(input.purchase_id, input.company_id);
  if (result.error || !result.purchase) {
    throw result.error || new Error("No se pudo cargar el draft de compra");
  }

  return {
    purchase: result.purchase,
    items: result.items,
  };
}
