export interface InvoiceCancelledEvent {
  type: "invoice.cancelled";
  occurredAt: string;
  payload: {
    invoiceId: string;
    reason: string;
    cancelledBy: string;
  };
}
