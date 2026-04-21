import { supabase } from "@/integrations/supabase/client";

export type ActivePaymentMethod = { id: string; name: string; code: string | null };

export async function getActivePaymentMethodsQuery(companyId: string): Promise<ActivePaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id,name,code")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message || "No se pudieron cargar métodos de pago");
  }

  return (data || []) as ActivePaymentMethod[];
}
