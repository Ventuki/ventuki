import { invoiceCache } from "../cache/invoice.cache";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import type { TenantContext } from "../types/invoice.types";

export async function getInvoiceUseCase(invoiceId: string, ctx: TenantContext) {
  const cached = invoiceCache.get(invoiceId);
  if (cached) return cached;

  const { data, error } = await invoiceRepository.getById(invoiceId, ctx);
  if (error || !data) throw error || new Error("Factura no encontrada");
  invoiceCache.set(data);
  return data;
}
