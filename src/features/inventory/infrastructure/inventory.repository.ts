import { supabase } from "@/integrations/supabase/client";
import type { StockRecord } from "../types/inventory.types";
import type { StockFilters } from "../validations/stock.schema";

export const inventoryRepository = {
  async getStock(filters: StockFilters) {
    let query = supabase
      .from("stock_levels" as any)
      .select(
        `id, company_id, warehouse_id, product_id, quantity, min_stock, max_stock,
         products!inner(name, sku),
         warehouses!inner(id, name, branch_id, branches!inner(id, name))`,
      )
      .eq("company_id", filters.company_id)
      .order("updated_at", { ascending: false });

    if (filters.warehouse_id && filters.warehouse_id !== "all") {
      query = query.eq("warehouse_id", filters.warehouse_id);
    }

    if (filters.branch_id && filters.branch_id !== "all") {
      query = (query as any).eq("warehouses.branch_id", filters.branch_id);
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      query = (query as any).or(`products.name.ilike.%${q}%,products.sku.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return { data: [] as StockRecord[], error };

    const rows = ((data || []) as any[]).map((row) => ({
      id: row.id,
      company_id: row.company_id,
      branch_id: row.warehouses?.branch_id ?? "",
      warehouse_id: row.warehouse_id,
      product_id: row.product_id,
      qty: Number(row.quantity || 0),
      reserved_qty: Number(row.reserved_qty || 0),
      min_qty: Number(row.min_stock || 0),
      max_qty: row.max_stock == null ? null : Number(row.max_stock),
      product_name: row.products?.name,
      product_sku: row.products?.sku,
      warehouse_name: row.warehouses?.name,
      branch_name: row.warehouses?.branches?.name,
    })) as unknown as StockRecord[];

    return { data: rows, error: null };
  },

  async adjustStock(input: {
    company_id: string;
    warehouse_id: string;
    product_id: string;
    delta: number;
    movement_type: string;
    notes?: string;
  }) {
    return supabase.rpc("adjust_stock", {
      _company_id: input.company_id,
      _warehouse_id: input.warehouse_id,
      _product_id: input.product_id,
      _delta: input.delta,
      _movement_type: input.movement_type,
      _notes: input.notes || null,
    });
  },

  async getByProductAndWarehouse(company_id: string, product_id: string, warehouse_id: string) {
    const { data, error } = await supabase
      .from("stock_levels" as any)
      .select("id, company_id, warehouse_id, product_id, quantity, min_stock, max_stock, warehouses(branch_id)")
      .eq("company_id", company_id)
      .eq("product_id", product_id)
      .eq("warehouse_id", warehouse_id)
      .maybeSingle();

    if (!data) return { data: null, error };

    const row = data as any;
    return {
      data: {
        id: row.id,
        company_id: row.company_id,
        branch_id: row.warehouses?.branch_id ?? "",
        warehouse_id: row.warehouse_id,
        product_id: row.product_id,
        qty: Number(row.quantity || 0),
        reserved_qty: Number(row.reserved_qty || 0),
        min_qty: Number(row.min_stock || 0),
        max_qty: row.max_stock,
      } as StockRecord,
      error,
    };
  },

  async adjustReserved(input: {
    company_id: string;
    warehouse_id: string;
    product_id: string;
    delta_reserved: number;
    notes?: string;
  }) {
    return supabase.rpc("reserve_stock", {
      _company_id: input.company_id,
      _warehouse_id: input.warehouse_id,
      _product_id: input.product_id,
      _delta_reserved: input.delta_reserved,
      _notes: input.notes || null,
    });
  },

  async transferStock(input: {
    company_id: string;
    from_warehouse_id: string;
    to_warehouse_id: string;
    product_id: string;
    quantity: number;
    notes?: string;
  }) {
    return supabase.rpc("transfer_stock" as any, {
      _company_id: input.company_id,
      _from_warehouse_id: input.from_warehouse_id,
      _to_warehouse_id: input.to_warehouse_id,
      _product_id: input.product_id,
      _quantity: input.quantity,
      _notes: input.notes || null,
    } as any);
  },
};
