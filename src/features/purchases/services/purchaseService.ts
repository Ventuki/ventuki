import { supabase } from "@/integrations/supabase/client";

export interface PurchaseRow {
  id: string;
  folio: string | null;
  status: "draft" | "confirmed" | "partial" | "received" | "cancelled";
  total: number;
  created_at: string;
  suppliers: { id: string; name: string };
}

export interface PurchaseItemDraft {
  product_id: string;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
}

export async function loadPurchaseMeta(companyId: string) {
  const [suppliersRes, productsRes, branchesRes, warehousesRes] = await Promise.all([
    supabase.from("suppliers" as any).select("id,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    supabase.from("products" as any).select("id,name,sku").eq("company_id", companyId).eq("is_active", true).order("name"),
    supabase.from("branches" as any).select("id,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    supabase.from("warehouses" as any).select("id,name").eq("company_id", companyId).eq("is_active", true).order("name"),
  ]);

  return {
    suppliers: (suppliersRes.data || []) as unknown as Array<{ id: string; name: string }>,
    products: (productsRes.data || []) as unknown as Array<{ id: string; name: string; sku?: string }>,
    branches: (branchesRes.data || []) as unknown as Array<{ id: string; name: string }>,
    warehouses: (warehousesRes.data || []) as unknown as Array<{ id: string; name: string }>,
    error: suppliersRes.error || productsRes.error || branchesRes.error || warehousesRes.error,
  };
}

export async function listPurchases(companyId: string) {
  const { data, error } = await supabase
    .from("purchases" as any)
    .select("id,folio,status,total,created_at,suppliers(id,name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  return { data: (data || []) as unknown as PurchaseRow[], error };
}

/** ★ FASE2 FIX: Crear compra atómicamente via RPC */
export async function createDirectPurchase(params: {
  companyId: string;
  branchId: string;
  supplierId: string;
  warehouseId: string;
  userId: string;
  invoiceNumber?: string;
  items: PurchaseItemDraft[];
}) {
  const itemsPayload = params.items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
  }));

  return await supabase.rpc("process_purchase_transaction" as any, {
    p_purchase_params: {
      company_id: params.companyId,
      branch_id: params.branchId,
      supplier_id: params.supplierId,
      warehouse_id: params.warehouseId,
      user_id: params.userId,
      invoice_number: params.invoiceNumber || null,
    },
    p_lines: itemsPayload,
  } as any);
}

export async function confirmPurchase(purchaseId: string, companyId: string) {
  return await supabase
    .from("purchases" as any)
    .update({ status: "confirmed" } as any)
    .eq("id", purchaseId)
    .eq("company_id", companyId)
    .eq("status", "draft");
}

export async function cancelPurchase(purchaseId: string, companyId: string) {
  return await supabase
    .from("purchases" as any)
    .update({ status: "cancelled" } as any)
    .eq("id", purchaseId)
    .eq("company_id", companyId)
    .in("status", ["draft", "confirmed", "partial"] as any);
}

export async function reopenPurchase(purchaseId: string, companyId: string) {
  return await supabase
    .from("purchases" as any)
    .update({ status: "draft" } as any)
    .eq("id", purchaseId)
    .eq("company_id", companyId)
    .eq("status", "cancelled");
}

export async function getPendingPurchaseItems(purchaseId: string) {
  const result = await supabase
    .from("purchase_items" as any)
    .select("id,quantity,received_qty,unit_cost,products(id,name,sku)")
    .eq("purchase_id", purchaseId)
    .order("created_at", { ascending: true });

  return { data: (result.data || []) as unknown as Array<any>, error: result.error };
}

export async function receivePurchase(params: {
  purchaseId: string;
  warehouseId: string;
  notes?: string;
  items: Array<{ purchase_item_id: string; quantity_received: number }>;
}) {
  return await supabase.rpc("receive_purchase" as any, {
    _purchase_id: params.purchaseId,
    _warehouse_id: params.warehouseId,
    _items: params.items,
    _notes: params.notes || null,
  } as any);
}
