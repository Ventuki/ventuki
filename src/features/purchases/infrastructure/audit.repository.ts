import { supabase } from "@/integrations/supabase/client";

export const purchaseAuditRepository = {
  async record(input: {
    company_id: string;
    actor_user_id?: string;
    action: "purchase.draft_updated" | "purchase.draft_created_from_restock";
    entity_id: string;
    new_data?: Record<string, unknown>;
  }) {
    return await supabase.from("audit_logs" as any).insert({
      company_id: input.company_id,
      user_id: input.actor_user_id || null,
      action: input.action,
      entity_type: "purchase",
      entity_id: input.entity_id,
      new_data: input.new_data || {},
    } as any);
  },
};
