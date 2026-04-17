import type { InvoiceRecord } from "../types/invoice.types";

export function FacturaPreview({ invoice }: { invoice: InvoiceRecord | null }) {
  if (!invoice) return <div className="text-sm text-muted-foreground">Selecciona una factura</div>;

  return (
    <div className="space-y-2 text-sm">
      <div>Serie/Folio: {invoice.series}-{invoice.folio}</div>
      <div>RFC: {invoice.fiscal_data.rfc}</div>
      <div>Total: ${invoice.total.toFixed(2)} {invoice.currency}</div>
      <div>Estatus: {invoice.status}</div>
    </div>
  );
}
