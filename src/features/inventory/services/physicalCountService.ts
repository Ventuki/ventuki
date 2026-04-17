import { supabase } from "@/integrations/supabase/client";

export interface PhysicalCountItemInput {
  product_id: string;
  counted_qty: number;
}

export interface CreatePhysicalCountInput {
  company_id: string;
  branch_id: string;
  warehouse_id: string;
  folio: string;
  notes?: string;
  counted_by?: string;
  items: PhysicalCountItemInput[];
}

export async function createPhysicalCount(input: CreatePhysicalCountInput) {
  return await supabase.rpc("create_physical_count_with_items", {
    _company_id: input.company_id,
    _branch_id: input.branch_id,
    _warehouse_id: input.warehouse_id,
    _folio: input.folio,
    _notes: input.notes || null,
    _counted_by: input.counted_by || null,
    _items: input.items,
  });
}

export async function listRecentPhysicalCounts(companyId: string, warehouseId?: string) {
  let query = supabase
    .from("physical_counts")
    .select("id,folio,status,warehouse_id,created_at,notes")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (warehouseId) query = query.eq("warehouse_id", warehouseId);

  return await query;
}

export async function postPhysicalCount(companyId: string, countId: string, notes?: string) {
  return await supabase.rpc("post_physical_count", {
    _company_id: companyId,
    _count_id: countId,
    _notes: notes || null,
  });
}

export async function getPhysicalCountItems(companyId: string, countId: string) {
  return await supabase
    .from("physical_count_items")
    .select("id,product_id,system_qty,counted_qty,difference_qty,products(name,sku)")
    .eq("company_id", companyId)
    .eq("count_id", countId)
    .order("created_at", { ascending: true });
}
