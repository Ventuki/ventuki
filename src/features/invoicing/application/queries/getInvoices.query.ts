import { invoiceListCache } from "../../cache/invoiceList.cache";
import { invoiceRepository } from "../../infrastructure/invoice.repository";
import type { InvoiceQuery } from "../../types/invoice.types";

export async function getInvoicesQuery(query: InvoiceQuery) {
  const cached = invoiceListCache.get(query.company_id, query.branch_id);
  if (cached && !query.from && !query.to && !query.sale_id && !query.status) return cached;

  const { data, error } = await invoiceRepository.list(query);
  if (error) throw error;
  if (!query.from && !query.to && !query.sale_id && !query.status) {
    invoiceListCache.set(query.company_id, query.branch_id, data);
  }
  return data;
}
