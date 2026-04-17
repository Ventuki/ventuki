import { purchaseRepository } from "../infrastructure/purchase.repository";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";

export async function confirmPurchaseUseCase(
  purchaseId: string,
  companyId: string,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.create");
  
  // FIX BUG #11: Cambia el status de draft a confirmed, listo para ser recibido.
  const { error } = await purchaseRepository.markConfirmed(purchaseId, companyId);
  if (error) {
    throw new Error("No se pudo confirmar la orden de compra.");
  }

  return { ok: true };
}
