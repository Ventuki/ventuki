import { invoiceCache } from "../cache/invoice.cache";
import { invoiceListCache } from "../cache/invoiceList.cache";
import { InvoiceEntity } from "../domain/Invoice.entity";
import { invoiceAuditRepository } from "../infrastructure/audit.repository";
import { creditNoteRepository } from "../infrastructure/creditNote.repository";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import { invoiceLogger } from "../infrastructure/logger";
import { satProviderService } from "../infrastructure/satProvider.service";
import type { CancelInvoiceCommand, InvoicePermission } from "../types/invoice.types";
import { cancelSchema } from "../validations/cancel.schema";
import { ensureInvoicePermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function cancelInvoiceUseCase(command: CancelInvoiceCommand, permissions: InvoicePermission[]) {
  ensureInvoicePermission(permissions, "invoice.cancel");
  const input = cancelSchema.parse(command) as any;

  const { data: invoice, error } = await invoiceRepository.getById(input.invoice_id, input);
  if (error || !invoice) throw error || new Error("Factura no encontrada");

  // FIX BUG #21: Impedir cancelar facturas que no están timbradas
  if (invoice.status !== "stamped" || !invoice.uuid) {
    throw new Error(`No se puede cancelar una factura en estado '${invoice.status}'. Debe estar timbrada.`);
  }

  const creditNoteStatus = await creditNoteRepository.hasAppliedCreditNote(input.invoice_id);
  new InvoiceEntity({ ...invoice, items: [] as any }).canCancel(creditNoteStatus.hasCreditNote);

  try {
    await satProviderService.cancel(invoice.uuid, input.reason);
    await invoiceRepository.markCancelled(invoice.id, input, input.reason);

    invoiceCache.invalidate(invoice.id);
    invoiceListCache.invalidate(input.company_id, input.branch_id);

    await invoiceAuditRepository.record({
      company_id: input.company_id,
      branch_id: input.branch_id,
      actor_user_id: input.performed_by,
      action: "invoice.cancelled",
      target_id: invoice.id,
      payload: { reason: input.reason },
    });

    const cancelledInvoice = { ...invoice, status: "cancelled" as const, cancel_reason: input.reason };

    domainEventBus.publish({
      type: "invoice.cancelled",
      payload: cancelledInvoice,
    });

    return cancelledInvoice;
  } catch (error) {
    invoiceLogger.error("cancelación fallida", { invoiceId: invoice.id, error });
    throw error;
  }
}

