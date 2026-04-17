import { supabase } from "@/integrations/supabase/client";
import type { SalePaymentRecord } from "../types/payment.types";

export const paymentRepository = {
  async createMany(rows: Omit<SalePaymentRecord, "id" | "created_at">[]) {
    return await supabase.from("sale_payments" as any).insert(rows as any);
  },
};
