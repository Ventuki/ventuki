import { purchaseRepository } from "../infrastructure/purchase.repository";
import { purchaseAuditRepository } from "../infrastructure/audit.repository";
import { updatePurchaseDraftSchema, type UpdatePurchaseDraftInput } from "../validations/purchase.schema";
import { ensurePurchasePermission, type PurchasePermission } from "./security/rbac.service";

export async function updatePurchaseDraftUseCase(
  command: UpdatePurchaseDraftInput,
  permissions: PurchasePermission[]
) {
  ensurePurchasePermission(permissions, "purchase.create");
  const input = updatePurchaseDraftSchema.parse(command) as any;

  const draft = await purchaseRepository.getDraftDetail(input.purchase_id, input.company_id);
  if (draft.error || !draft.purchase) {
    throw draft.error || new Error("La compra ya no está disponible para edición");
  }

  const headerResult = await purchaseRepository.updateDraftHeader({
    purchase_id: input.purchase_id,
    company_id: input.company_id,
    branch_id: input.branch_id,
    supplier_id: input.supplier_id,
    folio: input.folio,
    expected_date: input.expected_date,
    notes: input.notes,
  });
  if (headerResult.error) throw headerResult.error;

  const deleteItemsResult = await purchaseRepository.deleteDraftItems(input.purchase_id, input.company_id);
  if (deleteItemsResult.error) throw deleteItemsResult.error;

  const insertItemsResult = await purchaseRepository.insertDraftItems(input.purchase_id, input.company_id, input.items);
  if (insertItemsResult.error) throw insertItemsResult.error;

  await purchaseAuditRepository.record({
    company_id: input.company_id,
    actor_user_id: input.actor_user_id,
    action: "purchase.draft_updated",
    entity_id: input.purchase_id,
    new_data: {
      branch_id: input.branch_id,
      supplier_id: input.supplier_id,
      folio: input.folio || null,
      expected_date: input.expected_date || null,
      item_count: input.items.length,
    },
  });

  return { ok: true, purchase_id: input.purchase_id };
}
