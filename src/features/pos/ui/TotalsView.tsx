import type { SaleTotals } from "../types/sale.types";

export function TotalsView({ totals }: { totals: SaleTotals }) {
  return (
    <div className="rounded border p-3 text-sm">
      <p>Subtotal: {totals.subtotal.toFixed(2)}</p>
      <p>Descuento: {totals.discount_total.toFixed(2)}</p>
      <p>Impuestos: {totals.tax_total.toFixed(2)}</p>
      <p className="mt-2 text-base font-semibold">Total: {totals.grand_total.toFixed(2)}</p>
    </div>
  );
}
