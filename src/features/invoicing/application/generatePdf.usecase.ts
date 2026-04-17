import { invoiceAuditRepository } from "../infrastructure/audit.repository";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import { pdfGeneratorService } from "../infrastructure/pdfGenerator.service";
import type { InvoicePermission, TenantContext } from "../types/invoice.types";
import { ensureInvoicePermission } from "./security/rbac.service";

export async function generatePdfUseCase(invoiceId: string, ctx: TenantContext & { performed_by: string }, permissions: InvoicePermission[]) {
  ensureInvoicePermission(permissions, "invoice.download");

  const pdf = await pdfGeneratorService.generate(invoiceId);
  await invoiceRepository.setPdfUrl(invoiceId, ctx, pdf.pdf_url);
  await invoiceAuditRepository.record({
    company_id: ctx.company_id,
    branch_id: ctx.branch_id,
    actor_user_id: ctx.performed_by,
    action: "invoice.pdf.generated",
    target_id: invoiceId,
  });

  return pdf;
}
