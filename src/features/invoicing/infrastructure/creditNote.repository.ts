import { supabase } from "@/integrations/supabase/client";
import type { CreditNoteRecord } from "../types/invoice.types";

export const creditNoteRepository = {
  async create(input: Omit<CreditNoteRecord, "id" | "created_at">) {
    const { data, error } = await supabase.from("credit_notes" as any).insert(input as any).select("*").single();
    return { data: (data as unknown as CreditNoteRecord) ?? null, error };
  },

  async hasAppliedCreditNote(invoiceId: string) {
    const { count, error } = await supabase
      .from("credit_notes" as any)
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", invoiceId);
    return { hasCreditNote: !!count && count > 0, error };
  },
};
