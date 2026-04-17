import { supabase } from "@/integrations/supabase/client";
import type { PurchaseItemInput } from "../validations/purchase.schema";

export const purchaseRepository = {
  /** ★ FASE2 FIX #6: Crear compra atómicamente via RPC */
  async createDraft(input: {
    company_id: string;
    branch_id: string;
    supplier_id: string;
    folio?: string;
    expected_date?: string;
    notes?: string;
    items: PurchaseItemInput[];
  }) {
    const itemsPayload = input.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      tax_rate: item.tax_rate,
    }));

    return await supabase.rpc("create_purchase_with_items" as any, {
      _company_id: input.company_id,
      _branch_id: input.branch_id,
      _supplier_id: input.supplier_id,
      _folio: input.folio || null,
      _expected_date: input.expected_date || null,
      _notes: input.notes || null,
      _items: itemsPayload,
    } as any);
  },

  async receive(input: {
    purchase_id: string;
    warehouse_id: string;
    notes?: string;
    items: Array<{ purchase_item_id: string; quantity_received: number }>;
  }) {
    return await supabase.rpc("receive_purchase" as any, {
      _purchase_id: input.purchase_id,
      _warehouse_id: input.warehouse_id,
      _notes: input.notes || null,
      _items: JSON.stringify(input.items), 
    } as any);
  },

  async markConfirmed(purchaseId: string, companyId: string) {
    return await supabase
      .from("purchases" as any)
      .update({ status: "confirmed" } as any)
      .eq("id", purchaseId)
      .eq("company_id", companyId)
      .eq("status", "draft");
  }
};
