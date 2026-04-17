import { supabase } from "@/integrations/supabase/client";
import type { SupplierFormInput } from "../validations/supplier.schema";

export interface SupplierRecord {
  id: string;
  company_id: string;
  code: string | null;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const supplierRepository = {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from("suppliers" as any)
      .select("*")
      .eq("company_id", companyId)
      .order("name", { ascending: true });
      
    return { data: (data || []) as unknown as SupplierRecord[], error };
  },

  async create(input: SupplierFormInput) {
    const { data, error } = await supabase
      .from("suppliers" as any)
      .insert(input as any)
      .select("*")
      .single();
      
    return { data: (data as unknown as SupplierRecord) ?? null, error };
  },

  async update(id: string, companyId: string, input: Partial<SupplierFormInput>) {
    const { data, error } = await supabase
      .from("suppliers" as any)
      .update(input as any)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();
      
    return { data: (data as unknown as SupplierRecord) ?? null, error };
  }
};
