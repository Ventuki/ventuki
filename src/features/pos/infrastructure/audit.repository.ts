import { supabase } from "@/integrations/supabase/client";

export const auditRepository = {
  async record(input: {
    company_id: string;
    branch_id: string;
    actor_user_id: string;
    action: "sale.created" | "sale.cancelled" | "sale.discounted" | "sale.refunded";
    target_id: string;
    metadata?: Record<string, unknown>;
  }) {
    return await supabase.from("audit_logs" as any).insert({
      company_id: input.company_id,
      user_id: input.actor_user_id,
      action: input.action,
      entity_type: "sale",
      entity_id: input.target_id,
      new_data: input.metadata ?? {},
    } as any);
  },
};
