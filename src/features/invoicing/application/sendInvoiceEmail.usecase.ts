import { invoiceAuditRepository } from "../infrastructure/audit.repository";
import { emailService } from "../infrastructure/email.service";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import type { InvoicePermission, SendInvoiceEmailCommand } from "../types/invoice.types";
import { ensureInvoicePermission } from "./security/rbac.service";

export async function sendInvoiceEmailUseCase(command: SendInvoiceEmailCommand, permissions: InvoicePermission[]) {
  ensureInvoicePermission(permissions, "invoice.view");

  const { data: invoice, error } = await invoiceRepository.getById(command.invoice_id, command);
  if (error || !invoice) throw error || new Error("Factura no encontrada");

  const result = await emailService.sendInvoice(command.to, {
    pdfUrl: invoice.pdf_url,
    xmlUrl: invoice.xml_url,
  });

  await invoiceAuditRepository.record({
    company_id: command.company_id,
    branch_id: command.branch_id,
    actor_user_id: command.performed_by,
    action: "invoice.email.sent",
    target_id: invoice.id,
    payload: { to: command.to },
  });

  return result;
}
