import { supabase } from "@/integrations/supabase/client";

export const warehouseRepository = {
  async list(company_id: string, branch_id?: string) {
    let query = supabase.from("warehouses").select("id,name,branch_id").eq("company_id", company_id).eq("is_active", true);
    if (branch_id) query = query.eq("branch_id", branch_id);
    return query.order("name");
  },

  async exists(company_id: string, warehouse_id: string) {
    const { data, error } = await supabase
      .from("warehouses")
      .select("id")
      .eq("company_id", company_id)
      .eq("id", warehouse_id)
      .eq("is_active", true)
      .maybeSingle();

    return { exists: !!data, error };
  },
};
