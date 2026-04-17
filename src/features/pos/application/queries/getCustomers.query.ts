import type { TenantContext } from "../../types/sale.types";
import { customersCacheLayer } from "../../cache/customers.cache";
import { customerRepository } from "../../infrastructure/customer.repository";
import type { Database } from "@/integrations/supabase/types";

type CustomerSearchRow = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "id" | "first_name" | "last_name" | "business_name" | "tax_id"
>;

export async function getCustomersQuery(ctx: TenantContext, query: string) {
  const tenantKey = `${ctx.company_id}:${ctx.branch_id}:${ctx.warehouse_id}`;
  const cached = customersCacheLayer.get(tenantKey, query);
  if (cached) return cached;

  const result = await customerRepository.getCustomers(ctx, query);
  const rows = ((result.data || []) as CustomerSearchRow[]).map((row) => ({
    id: row.id,
    full_name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.business_name || "Sin nombre",
    tax_id: row.tax_id,
  }));

  customersCacheLayer.set(tenantKey, query, rows);
  return rows;
}
