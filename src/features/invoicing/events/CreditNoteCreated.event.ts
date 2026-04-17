import type { CreditNoteRecord } from "../types/invoice.types";

export interface CreditNoteCreatedEvent {
  type: "credit-note.created";
  occurredAt: string;
  payload: CreditNoteRecord;
}
