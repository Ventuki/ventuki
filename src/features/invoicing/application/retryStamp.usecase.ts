import { invoiceConfig } from "../config/invoice.config";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import { satProviderService } from "../infrastructure/satProvider.service";
import type { InvoicePermission, RetryStampCommand } from "../types/invoice.types";
import { ensureInvoicePermission } from "./security/rbac.service";

export async function retryStampUseCase(command: RetryStampCommand, permissions: InvoicePermission[]) {
  ensureInvoicePermission(permissions, "invoice.create");
  const { data: invoice, error } = await invoiceRepository.getById(command.invoice_id, command);
  if (error || !invoice) throw error || new Error("Factura no encontrada");

  const stamp = await satProviderService.withRetry(
    () => satProviderService.stamp(invoice.id),
    invoiceConfig.retryStamp.attempts,
    invoiceConfig.retryStamp.delayMs,
  );

  await invoiceRepository.markStamped(invoice.id, command, stamp);
  return stamp;
}
