export interface InvoiceStampedEvent {
  type: "invoice.stamped";
  occurredAt: string;
  payload: {
    invoiceId: string;
    uuid: string;
    xmlUrl: string;
  };
}
