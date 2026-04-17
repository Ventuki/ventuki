import { supabase } from "@/integrations/supabase/client";
import { createPurchaseUseCase } from "@/features/purchases/application/createPurchase.usecase";

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

export async function createDraftPurchase(params: {
  companyId: string;
  branchId: string;
  supplierId: string;
  userId: string;
  invoiceNumber?: string;
  expectedDate?: string;
  notes?: string;
  items: PurchaseItemDraft[];
}) {
  try {
    const result = await createPurchaseUseCase(
      {
        company_id: params.companyId,
        branch_id: params.branchId,
        actor_user_id: params.userId,
        supplier_id: params.supplierId,
        folio: params.invoiceNumber || undefined,
        expected_date: params.expectedDate || undefined,
        notes: params.notes || undefined,
        items: params.items,
      },
      ["purchase.create"],
    );

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
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

export async function suggestSupplierForProducts(companyId: string, productIds: string[]) {
  if (productIds.length === 0) return { supplierId: null as string | null, supplierName: null as string | null };

  const { data, error } = await supabase
    .from("purchase_items" as any)
    .select("product_id,purchases!inner(supplier_id,suppliers(name),company_id,created_at)")
    .in("product_id", productIds)
    .order("created_at", { foreignTable: "purchases", ascending: false });

  if (error || !data) {
    return { supplierId: null as string | null, supplierName: null as string | null };
  }

  const groupedByProduct = new Map<string, { supplierId: string; supplierName: string | null }>();

  for (const row of data as any[]) {
    const productId = row.product_id as string;
    if (groupedByProduct.has(productId)) continue;
    if (row?.purchases?.company_id !== companyId || !row?.purchases?.supplier_id) continue;
    groupedByProduct.set(productId, {
      supplierId: row.purchases.supplier_id as string,
      supplierName: row.purchases?.suppliers?.name || null,
    });
  }

  const counts = new Map<string, { count: number; name: string | null }>();
  for (const hit of groupedByProduct.values()) {
    const current = counts.get(hit.supplierId);
    counts.set(hit.supplierId, {
      count: (current?.count || 0) + 1,
      name: hit.supplierName || current?.name || null,
    });
  }

  const best = [...counts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  if (!best) return { supplierId: null as string | null, supplierName: null as string | null };

  return { supplierId: best[0], supplierName: best[1].name };
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
