import { supabase } from "@/integrations/supabase/client";
import type { TenantContext } from "../types/sale.types";

export const customerRepository = {
  async getCustomers(ctx: TenantContext, query: string) {
    const term = query.trim();
    const baseQuery = supabase
      .from("customers")
      .select("id,first_name,last_name,business_name,tax_id")
      .eq("company_id", ctx.company_id)
      .limit(20);

    if (!term) return await baseQuery.order("created_at", { ascending: false });

    const safeTerm = term.replace(/,/g, "");
    const searchExpr = `first_name.ilike.%${safeTerm}%,last_name.ilike.%${safeTerm}%,business_name.ilike.%${safeTerm}%,tax_id.ilike.%${safeTerm}%`;

    return await baseQuery.or(searchExpr);
  },
};
