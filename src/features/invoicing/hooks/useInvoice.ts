import { useQuery } from "@tanstack/react-query";
import { getInvoiceUseCase } from "../application/getInvoice.usecase";
import type { TenantContext } from "../types/invoice.types";

export function useInvoice(invoiceId: string, ctx: TenantContext) {
  return useQuery({
    queryKey: ["invoice", ctx.company_id, ctx.branch_id, invoiceId],
    queryFn: () => getInvoiceUseCase(invoiceId, ctx),
    enabled: !!invoiceId,
  });
}
