import { purchaseRepository } from "../infrastructure/purchase.repository";
import { purchaseSchema, type CreatePurchaseInput } from "../validations/purchase.schema";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";

export async function createPurchaseUseCase(
  command: CreatePurchaseInput,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.create");
  const input = purchaseSchema.parse(command) as any;

  // Todo: Validación adicional como verificar que el proveedor existe (se podría hacer en repositorio)
  
  const result = await purchaseRepository.createDraft({
    company_id: input.company_id,
    branch_id: input.branch_id,
    supplier_id: input.supplier_id,
    folio: input.folio,
    expected_date: input.expected_date,
    notes: input.notes,
    items: input.items,
  });

  if (result.error || !result.data) {
    throw result.error || new Error("Error inesperado al crear la orden de compra");
  }

  return { ok: true, purchase_id: result.data.id };
}
