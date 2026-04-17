import { invoiceRepository } from "../../infrastructure/invoice.repository";
import type { TenantContext } from "../../types/invoice.types";

export async function getInvoicesByDateQuery(ctx: TenantContext, from: string, to: string) {
  const { data, error } = await invoiceRepository.list({ ...ctx, from, to });
  if (error) throw error;
  return data;
}
