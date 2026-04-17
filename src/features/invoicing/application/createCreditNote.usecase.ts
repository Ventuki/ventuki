import { CreditNoteEntity } from "../domain/CreditNote.entity";
import type { CreditNoteCreatedEvent } from "../events/CreditNoteCreated.event";
import { invoiceAuditRepository } from "../infrastructure/audit.repository";
import { creditNoteRepository } from "../infrastructure/creditNote.repository";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import type { CreateCreditNoteCommand, InvoicePermission } from "../types/invoice.types";
import { ensureInvoicePermission } from "./security/rbac.service";

export async function createCreditNoteUseCase(command: CreateCreditNoteCommand, permissions: InvoicePermission[]) {
  ensureInvoicePermission(permissions, "invoice.credit_note");

  const { data: invoice, error } = await invoiceRepository.getById(command.invoice_id, command);
  if (error || !invoice) throw error || new Error("Factura no encontrada");

  new CreditNoteEntity(command).validate(invoice.total, invoice.status);

  const { data: creditNote, error: saveError } = await creditNoteRepository.create({
    ...command,
    created_by: command.performed_by,
  });
  if (saveError || !creditNote) throw saveError || new Error("No se pudo crear nota de crédito");

  const event: CreditNoteCreatedEvent = {
    type: "credit-note.created",
    occurredAt: new Date().toISOString(),
    payload: creditNote,
  };

  await invoiceAuditRepository.record({
    company_id: command.company_id,
    branch_id: command.branch_id,
    actor_user_id: command.performed_by,
    action: event.type,
    target_id: command.invoice_id,
    payload: { amount: command.amount, reason: command.reason },
  });

  return creditNote;
}
