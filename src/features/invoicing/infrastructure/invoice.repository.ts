import { supabase } from "@/integrations/supabase/client";
import type { InvoiceQuery, InvoiceRecord, TenantContext } from "../types/invoice.types";

export const invoiceRepository = {
  async getNextFolio(ctx: TenantContext, series: string) {
    const { data, error } = await supabase.rpc("get_next_folio_locked" as any, {
      _company_id: ctx.company_id,
      _branch_id: ctx.branch_id,
      _series: series,
    } as any);

    if (error) throw error;
    return Number(data ?? 1);
  },

  async create(invoice: Omit<InvoiceRecord, "id">) {
    const { data, error } = await supabase.from("invoices" as any).insert(invoice as any).select("*").single();
    return { data: (data as unknown as InvoiceRecord) ?? null, error };
  },

  async getById(id: string, ctx: TenantContext) {
    const { data, error } = await supabase
      .from("invoices" as any)
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.company_id)
      .eq("branch_id", ctx.branch_id)
      .maybeSingle();
    return { data: (data as unknown as InvoiceRecord) ?? null, error };
  },

  async list(query: InvoiceQuery) {
    let request = supabase
      .from("invoices" as any)
      .select("*")
      .eq("company_id", query.company_id)
      .eq("branch_id", query.branch_id)
      .order("created_at", { ascending: false });

    if (query.sale_id) request = request.eq("sale_id", query.sale_id);
    if (query.status) request = request.eq("status", query.status);
    if (query.from) request = request.gte("created_at", query.from);
    if (query.to) request = request.lte("created_at", query.to);

    const { data, error } = await request;
    return { data: (data as unknown as InvoiceRecord[]) ?? [], error };
  },

  async markStamped(id: string, ctx: TenantContext, stamp: { uuid: string; xml_url: string }) {
    return await supabase
      .from("invoices" as any)
      .update({ status: "stamped", stamped_at: new Date().toISOString(), uuid: stamp.uuid, xml_url: stamp.xml_url } as any)
      .eq("id", id)
      .eq("company_id", ctx.company_id)
      .eq("branch_id", ctx.branch_id);
  },

  async markCancelled(id: string, ctx: TenantContext, reason: string) {
    return await supabase
      .from("invoices" as any)
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: reason } as any)
      .eq("id", id)
      .eq("company_id", ctx.company_id)
      .eq("branch_id", ctx.branch_id);
  },

  async setPdfUrl(id: string, ctx: TenantContext, pdf_url: string) {
    return await supabase
      .from("invoices" as any)
      .update({ pdf_url } as any)
      .eq("id", id)
      .eq("company_id", ctx.company_id)
      .eq("branch_id", ctx.branch_id);
  },
};
