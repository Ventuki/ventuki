import { supabase } from "@/integrations/supabase/client";

interface AuditInput {
  company_id: string;
  branch_id: string;
  actor_user_id: string;
  action: string;
  target_id: string;
  payload?: Record<string, unknown>;
}

export const invoiceAuditRepository = {
  async record(input: AuditInput) {
    await supabase.from("audit_logs" as any).insert({
      ...input,
      module: "invoicing",
      created_at: new Date().toISOString(),
    } as any);
  },
};
