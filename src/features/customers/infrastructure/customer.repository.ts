import { supabase } from "@/integrations/supabase/client";
import type { CustomerInput, CustomerRecord } from "../validations/customer.schema";

export const customerRepository = {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from("customers" as any)
      .select("*")
      .eq("company_id", companyId)
      .order("first_name", { ascending: true });
      
    return { data: ((data || []) as unknown as CustomerRecord[]), error };
  },

  async create(input: CustomerInput) {
    const { data, error } = await supabase
      .from("customers" as any)
      .insert(input as any)
      .select("*")
      .single();
      
    return { data: (data as unknown as CustomerRecord) ?? null, error };
  },

  async update(id: string, companyId: string, input: Partial<CustomerInput>) {
    const { data, error } = await supabase
      .from("customers" as any)
      .update(input as any)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();
      
    return { data: (data as unknown as CustomerRecord) ?? null, error };
  }
};
