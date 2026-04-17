import { supabase } from "@/integrations/supabase/client";
import type { TransferRecord } from "../types/transfer.types";

export const transferRepository = {
  async create(input: Omit<TransferRecord, "id" | "created_at" | "status">) {
    const { data, error } = await supabase
      .from("inventory_transfers" as any)
      .insert({
        company_id: input.company_id,
        branch_id: input.branch_id,
        from_warehouse: input.from_warehouse,
        to_warehouse: input.to_warehouse,
        product_id: input.product_id,
        qty: input.qty,
        status: "completed",
        notes: input.notes || null,
        actor_user_id: input.actor_user_id || null,
      } as any)
      .select("id,company_id,branch_id,from_warehouse,to_warehouse,product_id,qty,status,notes,created_at,actor_user_id")
      .maybeSingle();

    return { data: (data as unknown as TransferRecord) || null, error };
  },
};
