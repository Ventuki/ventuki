import { supabase } from "@/integrations/supabase/client";
import type { InventoryAuditRecord } from "../types/inventory.types";

export const inventoryAuditRepository = {
  async record(input: InventoryAuditRecord) {
    return supabase.from("audit_logs" as any).insert({
      company_id: input.company_id,
      user_id: input.actor_user_id || null,
      action: input.action,
      entity_type: "inventory",
      entity_id: input.target_id || null,
      new_data: input.payload || {},
    } as any);
  },
};
