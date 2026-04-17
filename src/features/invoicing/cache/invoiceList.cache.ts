import type { InvoiceRecord } from "../types/invoice.types";

const listMap = new Map<string, InvoiceRecord[]>();

export const invoiceListCache = {
  key(company_id: string, branch_id: string) {
    return `${company_id}:${branch_id}`;
  },
  get(company_id: string, branch_id: string) {
    return listMap.get(this.key(company_id, branch_id)) ?? null;
  },
  set(company_id: string, branch_id: string, list: InvoiceRecord[]) {
    listMap.set(this.key(company_id, branch_id), list);
  },
  invalidate(company_id: string, branch_id: string) {
    listMap.delete(this.key(company_id, branch_id));
  },
};
