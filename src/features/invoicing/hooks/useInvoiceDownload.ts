import { useMutation } from "@tanstack/react-query";
import { generatePdfUseCase } from "../application/generatePdf.usecase";
import type { InvoicePermission, TenantContext } from "../types/invoice.types";

export function useInvoiceDownload(permissions: InvoicePermission[]) {
  return useMutation({
    mutationFn: ({ invoiceId, ctx }: { invoiceId: string; ctx: TenantContext & { performed_by: string } }) =>
      generatePdfUseCase(invoiceId, ctx, permissions),
  });
}
