import { createPurchaseUseCase } from "./createPurchase.usecase";
import { getSuggestedSuppliersByProduct } from "../services/purchaseService";
import { purchaseAuditRepository } from "../infrastructure/audit.repository";
import type { PurchaseItemDraft } from "../services/purchaseService";

export async function createPurchaseDraftFromReorderUseCase(input: {
  company_id: string;
  branch_id: string;
  actor_user_id: string;
  notes?: string;
  items: PurchaseItemDraft[];
}) {
  const suggestions = await getSuggestedSuppliersByProduct(input.company_id, input.items.map((item) => item.product_id));

  const groupedItems = new Map<string, { supplierName: string | null; items: PurchaseItemDraft[] }>();
  const unresolvedItems: PurchaseItemDraft[] = [];

  for (const item of input.items) {
    const supplier = suggestions.get(item.product_id);
    if (!supplier?.supplierId) {
      unresolvedItems.push(item);
      continue;
    }

    const current = groupedItems.get(supplier.supplierId);
    if (current) {
      current.items.push(item);
    } else {
      groupedItems.set(supplier.supplierId, {
        supplierName: supplier.supplierName,
        items: [item],
      });
    }
  }

  if (groupedItems.size === 0) {
    throw new Error("No se pudo sugerir proveedor para esta recompra. Completa la compra manualmente en Compras.");
  }

  const drafts: Array<{ purchase_id: string; supplier_id: string; supplier_name: string | null; item_count: number }> = [];

  for (const [supplierId, group] of groupedItems.entries()) {
    const result = await createPurchaseUseCase({
      company_id: input.company_id,
      branch_id: input.branch_id,
      actor_user_id: input.actor_user_id,
      supplier_id: supplierId,
      notes: input.notes,
      items: group.items,
    }, ["purchase.create"]);

    drafts.push({
      purchase_id: result.purchase_id,
      supplier_id: supplierId,
      supplier_name: group.supplierName,
      item_count: group.items.length,
    });

    await purchaseAuditRepository.record({
      company_id: input.company_id,
      actor_user_id: input.actor_user_id,
      action: "purchase.draft_created_from_restock",
      entity_id: result.purchase_id,
      new_data: {
        source: "inventory.restock_suggestion",
        supplier_id: supplierId,
        supplier_name: group.supplierName,
        item_count: group.items.length,
        items: group.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      },
    });
  }

  return {
    ok: true,
    drafts,
    unresolved_items: unresolvedItems.length,
  };
}
