import { invoiceRepository } from "../../infrastructure/invoice.repository";
import type { TenantContext } from "../../types/invoice.types";

export async function getInvoiceBySaleQuery(ctx: TenantContext, saleId: string) {
  const { data, error } = await invoiceRepository.list({ ...ctx, sale_id: saleId });
  if (error) throw error;
  return data[0] ?? null;
}
