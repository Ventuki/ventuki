import { supabase } from "@/integrations/supabase/client";

export interface DashboardKpis {
  salesToday: number;
  transactionsToday: number;
  activeProducts: number;
  activeCustomers: number;
}

function getDayRangeUtc(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getDashboardKpis(companyId: string, branchId: string): Promise<DashboardKpis> {
  const { start, end } = getDayRangeUtc();

  const [salesRes, productsRes, customersRes] = await Promise.all([
    supabase
      .from("sales" as any)
      .select("id,total", { count: "exact" })
      .eq("company_id", companyId)
      .eq("branch_id", branchId)
      .eq("status", "completed")
      .gte("created_at", start)
      .lt("created_at", end),
    supabase
      .from("products" as any)
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true),
    supabase
      .from("customers" as any)
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true),
  ]);

  if (salesRes.error) throw salesRes.error;
  if (productsRes.error) throw productsRes.error;
  if (customersRes.error) throw customersRes.error;

  const salesRows = (salesRes.data || []) as Array<{ total?: number }>;

  return {
    salesToday: salesRows.reduce((acc, row) => acc + Number(row.total || 0), 0),
    transactionsToday: Number(salesRes.count || 0),
    activeProducts: Number(productsRes.count || 0),
    activeCustomers: Number(customersRes.count || 0),
  };
}
