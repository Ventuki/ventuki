import { supabase } from "@/integrations/supabase/client";
import type { SaleRecord, TenantContext } from "../types/sale.types";

export const saleRepository = {
  async createDraft(input: Omit<SaleRecord, "id" | "created_at" | "status" | "totals">) {
    const { data, error } = await supabase
      .from("sales" as any)
      .insert({
        ...input,
        status: "draft",
        subtotal: 0,
        discount_total: 0,
        tax_total: 0,
        total: 0,
      } as any)
      .select("*")
      .single();

    return { data: data as unknown as SaleRecord | null, error };
  },

  async updateTotals(saleId: string, ctx: TenantContext, totals: SaleRecord["totals"], status: SaleRecord["status"]) {
    return await supabase
      .from("sales" as any)
      .update({
        subtotal: totals.subtotal,
        discount_total: totals.discount_total,
        tax_total: totals.tax_total,
        total: totals.grand_total,
        status,
      } as any)
      .eq("id", saleId)
      .eq("company_id", ctx.company_id)
      .eq("branch_id", ctx.branch_id);
  },

  async cancel(saleId: string, ctx: TenantContext, reason: string) {
    return await supabase
      .from("sales" as any)
      .update({ status: "cancelled", cancellation_reason: reason } as any)
      .eq("id", saleId)
      .eq("company_id", ctx.company_id)
      .eq("branch_id", ctx.branch_id);
  },
};
