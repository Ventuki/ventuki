import { supabase } from "@/integrations/supabase/client";
import type { TenantContext } from "../types/sale.types";

export const cashRepository = {
  async registerIncome(ctx: TenantContext, saleId: string, amount: number, userId: string) {
    return await supabase.from("cash_movements" as any).insert({
      company_id: ctx.company_id,
      branch_id: ctx.branch_id,
      type: "income",
      amount,
      reference: `POS:${saleId}`,
      created_by: userId,
    } as any);
  },
};
