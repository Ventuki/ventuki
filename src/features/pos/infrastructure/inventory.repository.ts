import { supabase } from "@/integrations/supabase/client";
import type { TenantContext } from "../types/sale.types";

export const inventoryRepository = {
  async getStock(ctx: TenantContext, productId: string) {
    return await supabase
      .from("stock_levels" as any)
      .select("quantity")
      .eq("company_id", ctx.company_id)
      .eq("warehouse_id", ctx.warehouse_id)
      .eq("product_id", productId)
      .maybeSingle();
  },

  async discountStock(ctx: TenantContext, productId: string, quantity: number, saleId: string) {
    return await supabase.rpc("adjust_stock" as any, {
      _company_id: ctx.company_id,
      _warehouse_id: ctx.warehouse_id,
      _product_id: productId,
      _delta: -Math.abs(quantity),
      _movement_type: "sale",
      _notes: `POS sale ${saleId}`,
    } as any);
  },
  
  async getDefaultWarehouse(companyId: string, branchId: string) {
    return await supabase
      .from("warehouses" as any)
      .select("id")
      .eq("company_id", companyId)
      .eq("branch_id", branchId)
      .limit(1)
      .maybeSingle();
  },
};
