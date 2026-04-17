import { supabase } from "@/integrations/supabase/client";

export interface SupplierRow {
  id: string;
  code: string | null;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  payment_terms_days: number;
  commercial_status: "active" | "blocked" | "review";
}

export interface SupplierPayload {
  company_id: string;
  supplier_type_id?: string | null;
  code?: string | null;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_id?: string | null;
  address?: string | null;
  notes?: string | null;
  payment_terms_days?: number;
  commercial_status?: "active" | "blocked" | "review";
  is_active: boolean;
}

export async function searchSuppliers(companyId: string, search: string) {
  let query = supabase
    .from("suppliers" as any)
    .select("id,code,name,contact_name,phone,email,is_active,payment_terms_days,commercial_status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const term = search.trim();
  if (term) {
    const safe = term.replace(/,/g, "");
    query = query.or(`name.ilike.%${safe}%,code.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  return { data: (data || []) as unknown as SupplierRow[], error };
}

export async function getSupplierById(id: string, companyId: string) {
  const result = await supabase
    .from("suppliers" as any)
    .select("id,code,name,supplier_type_id,contact_name,phone,email,tax_id,address,notes,is_active,payment_terms_days,commercial_status")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  return { data: result.data as unknown as Record<string, any> | null, error: result.error };
}

export async function upsertSupplier(id: string, payload: SupplierPayload) {
  if (id) {
    return await supabase.from("suppliers" as any).update(payload as any).eq("id", id).select("id").single();
  }

  return await supabase.from("suppliers" as any).insert(payload as any).select("id").single();
}

export async function deleteSupplier(id: string, companyId: string) {
  return await supabase
    .from("suppliers" as any)
    .update({ is_active: false } as any)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("id")
    .single();
}

export async function hasSupplierPurchases(id: string, companyId: string) {
  const { count, error } = await supabase
    .from("purchases" as any)
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", id)
    .eq("company_id", companyId);

  return { count: Number(count || 0), error };
}

export async function deactivateSupplier(id: string, companyId: string) {
  return await supabase
    .from("suppliers" as any)
    .update({ is_active: false } as any)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("id")
    .single();
}
