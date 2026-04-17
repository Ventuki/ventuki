import type { InvoiceItemRecord } from "../types/invoice.types";
import type { TaxSummary } from "../types/tax.types";

export class TaxCalculationEntity {
  static calculate(items: InvoiceItemRecord[]): TaxSummary {
    const subtotal = items.reduce((acc, item) => acc + item.qty * item.price - (item.discount ?? 0), 0);
    const taxes = items.flatMap((item) => item.taxes);
    const totalTaxes = taxes.reduce((acc, tax) => acc + tax.amount, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxes,
      totalTaxes: Number(totalTaxes.toFixed(2)),
      total: Number((subtotal + totalTaxes).toFixed(2)),
    };
  }
}
