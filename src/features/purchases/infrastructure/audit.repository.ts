import { supabase } from "@/integrations/supabase/client";

export const purchaseAuditRepository = {
  async record(input: {
    company_id: string;
    actor_user_id?: string;
    action: "purchase.draft_updated" | "purchase.draft_created_from_restock" | "purchase.confirmed" | "purchase.cancelled" | "purchase.reopened" | "purchase.received";
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

  async wasCreatedFromRestock(companyId: string, purchaseId: string) {
    const { data, error } = await supabase
      .from("audit_logs" as any)
      .select("id,new_data")
      .eq("company_id", companyId)
      .eq("entity_type", "purchase")
      .eq("entity_id", purchaseId)
      .eq("action", "purchase.draft_created_from_restock")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { data, error, fromRestock: Boolean(data) };
  },
};
