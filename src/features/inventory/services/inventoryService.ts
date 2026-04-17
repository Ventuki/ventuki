import { supabase } from "@/integrations/supabase/client";
import { buildInventoryFilter } from "@/features/inventory/utils/stock";

export interface WarehouseOption { id: string; name: string }
export interface ProductOption { id: string; name: string; sku: string }
export interface StockRow {
  id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number | null;
  products: { id: string; name: string; sku: string };
  warehouses: { id: string; name: string };
}

export async function loadInventoryMeta(companyId: string) {
  const [wRes, pRes] = await Promise.all([
    supabase.from("warehouses").select("id,name").eq("company_id", companyId).eq("is_active", true),
    supabase.from("products" as any).select("id,name,sku").eq("company_id", companyId).eq("is_active", true),
  ]);

  return {
    warehouses: (wRes.data || []) as WarehouseOption[],
    products: (pRes.data || []) as unknown as ProductOption[],
    error: wRes.error || pRes.error,
  };
}

export async function loadStockLevels(companyId: string, warehouseId: string, search: string) {
  const term = search.trim();
  let productIdsFromBarcode: string[] = [];

  if (term) {
    const { data: barcodeMatches } = await supabase
      .from("product_barcodes" as any)
      .select("product_id")
      .eq("company_id", companyId)
      .ilike("barcode", `%${term}%`);
    productIdsFromBarcode = ((barcodeMatches || []) as unknown as Array<{ product_id: string }>).map((b) => b.product_id);
  }

  let query = supabase
    .from("stock_levels" as any)
    .select("id,quantity,min_stock,max_stock,products(id,name,sku),warehouses(id,name),product_id")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (warehouseId !== "all") query = query.eq("warehouse_id", warehouseId);

  const { data, error } = await query;
  if (error) return { data: [], error };

  const filtered = buildInventoryFilter((data || []) as unknown as StockRow[], term, productIdsFromBarcode);
  return { data: filtered, error: null };
}

export async function applyStockAdjustment(params: {
  companyId: string;
  warehouseId: string;
  productId: string;
  delta: number;
  movementType: string;
  notes?: string;
}) {
  return await supabase.rpc("adjust_stock" as any, {
    _company_id: params.companyId,
    _warehouse_id: params.warehouseId,
    _product_id: params.productId,
    _delta: params.delta,
    _movement_type: params.movementType,
    _notes: params.notes || null,
  } as any);
}
