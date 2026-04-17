import type { InvoiceRecord } from "../types/invoice.types";

export interface InvoiceCreatedEvent {
  type: "invoice.created";
  occurredAt: string;
  payload: InvoiceRecord;
}
