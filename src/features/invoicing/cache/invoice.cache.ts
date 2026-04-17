import type { InvoiceRecord } from "../types/invoice.types";

const invoiceMap = new Map<string, InvoiceRecord>();

export const invoiceCache = {
  get(id: string) {
    return invoiceMap.get(id) ?? null;
  },
  set(invoice: InvoiceRecord) {
    invoiceMap.set(invoice.id, invoice);
  },
  invalidate(id: string) {
    invoiceMap.delete(id);
  },
};
