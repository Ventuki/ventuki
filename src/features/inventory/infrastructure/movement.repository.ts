import { supabase } from "@/integrations/supabase/client";
import type { MovementRecord } from "../types/movement.types";

export const movementRepository = {
  async create(input: {
    company_id: string;
    branch_id: string;
    warehouse_id: string;
    product_id: string;
    qty: number;
    type: string;
    reference?: string;
    notes?: string;
    actor_user_id?: string;
  }) {
    return supabase.from("stock_movements").insert({
      company_id: input.company_id,
      warehouse_id: input.warehouse_id,
      product_id: input.product_id,
      quantity: input.qty,
      movement_type: input.type,
      reference_id: input.reference || null,
      notes: input.notes || null,
      user_id: input.actor_user_id || null,
    });
  },

  async getKardex(filters: { company_id: string; warehouse_id?: string; product_id?: string; limit?: number }) {
    let query = supabase
      .from("stock_movements" as any)
      .select("id,company_id,warehouse_id,product_id,quantity,movement_type,reference_id,notes,user_id,created_at,products(name,sku),warehouses(name,branch_id)")
      .eq("company_id", filters.company_id)
      .order("created_at", { ascending: false })
      .limit(filters.limit || 150);

    if (filters.warehouse_id && filters.warehouse_id !== "all") query = query.eq("warehouse_id", filters.warehouse_id);
    if (filters.product_id) query = query.eq("product_id", filters.product_id);

    const { data, error } = await query;
    if (error) return { data: [] as MovementRecord[], error };

    return {
      data: ((data || []) as any[]).map((row) => ({
        id: row.id,
        company_id: row.company_id,
        branch_id: row.warehouses?.branch_id,
        warehouse_id: row.warehouse_id,
        product_id: row.product_id,
        qty: Number(row.quantity),
        type: row.movement_type,
        reference: row.reference_id,
        notes: row.notes,
        created_at: row.created_at,
        actor_user_id: row.user_id,
        product_name: row.products?.name,
        product_sku: row.products?.sku,
        warehouse_name: row.warehouses?.name,
      })) as unknown as MovementRecord[],
      error: null,
    };
  },
};
