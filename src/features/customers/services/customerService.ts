import { supabase } from "@/integrations/supabase/client";

export interface CustomerRow {
  id: string;
  code: string | null;
  first_name: string;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
  tax_id: string | null;
  is_active: boolean;
}

/** Helper para mostrar nombre completo en listados */
export function customerDisplayName(c: Partial<CustomerRow>): string {
  if (c.business_name) return c.business_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre";
}

export interface CustomerPayload {
  company_id: string;
  code?: string | null;
  first_name: string;
  last_name?: string | null;
  business_name?: string | null;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
}

export async function searchCustomers(companyId: string, search: string) {
  let query = supabase
    .from("customers" as any)
    .select("id,code,first_name,last_name,business_name,email,tax_id,is_active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const term = search.trim();
  if (term) {
    const safe = term.replace(/,/g, "");
    query = query.or(
      `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,business_name.ilike.%${safe}%,code.ilike.%${safe}%,email.ilike.%${safe}%,tax_id.ilike.%${safe}%`
    );
  }

  const { data, error } = await query;
  return { data: (data || []) as unknown as CustomerRow[], error };
}

export async function getCustomerById(id: string, companyId: string) {
  const { data, error } = await supabase
    .from("customers" as any)
    .select("id,code,first_name,last_name,business_name,email,phone,tax_id,address,notes,is_active")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  return { data: data as unknown as Record<string, any> | null, error };
}

export async function upsertCustomer(id: string, payload: CustomerPayload) {
  if (id) {
    return await supabase
      .from("customers" as any)
      .update(payload as any)
      .eq("id", id)
      .eq("company_id", payload.company_id)
      .select("id")
      .single();
  }

  return await supabase
    .from("customers" as any)
    .insert(payload as any)
    .select("id")
    .single();
}

export async function deleteCustomer(id: string, companyId: string) {
  return await supabase
    .from("customers" as any)
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
}
