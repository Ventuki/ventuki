import { supabase } from "@/integrations/supabase/client";
import type { PurchaseItemInput } from "../validations/purchase.schema";

function toItemRows(companyId: string, purchaseId: string, items: PurchaseItemInput[]) {
  return items.map((item) => ({
    company_id: companyId,
    purchase_id: purchaseId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    tax_rate: item.tax_rate,
    received_qty: 0,
  }));
}

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
  },

  async markCancelled(purchaseId: string, companyId: string) {
    return await supabase
      .from("purchases" as any)
      .update({ status: "cancelled" } as any)
      .eq("id", purchaseId)
      .eq("company_id", companyId)
      .in("status", ["draft", "confirmed", "partial"] as any);
  },

  async markDraft(purchaseId: string, companyId: string) {
    return await supabase
      .from("purchases" as any)
      .update({ status: "draft" } as any)
      .eq("id", purchaseId)
      .eq("company_id", companyId)
      .eq("status", "cancelled");
  },

  async getDraftDetail(purchaseId: string, companyId: string) {
    const [purchaseRes, itemsRes] = await Promise.all([
      supabase
        .from("purchases" as any)
        .select("id,branch_id,supplier_id,folio,expected_date,notes,status")
        .eq("id", purchaseId)
        .eq("company_id", companyId)
        .eq("status", "draft")
        .single(),
      supabase
        .from("purchase_items" as any)
        .select("id,product_id,quantity,unit_cost,tax_rate,received_qty")
        .eq("purchase_id", purchaseId)
        .eq("company_id", companyId)
        .order("created_at", { ascending: true }),
    ]);

    return {
      purchase: purchaseRes.data,
      items: itemsRes.data || [],
      error: purchaseRes.error || itemsRes.error,
    };
  },

  async updateDraftHeader(input: {
    purchase_id: string;
    company_id: string;
    branch_id: string;
    supplier_id: string;
    folio?: string;
    expected_date?: string;
    notes?: string;
  }) {
    return await supabase
      .from("purchases" as any)
      .update({
        branch_id: input.branch_id,
        supplier_id: input.supplier_id,
        folio: input.folio || null,
        expected_date: input.expected_date || null,
        notes: input.notes || null,
      } as any)
      .eq("id", input.purchase_id)
      .eq("company_id", input.company_id)
      .eq("status", "draft");
  },

  async deleteDraftItems(purchaseId: string, companyId: string) {
    return await supabase
      .from("purchase_items" as any)
      .delete()
      .eq("purchase_id", purchaseId)
      .eq("company_id", companyId);
  },

  async insertDraftItems(purchaseId: string, companyId: string, items: PurchaseItemInput[]) {
    return await supabase
      .from("purchase_items" as any)
      .insert(toItemRows(companyId, purchaseId, items) as any);
  }
};
