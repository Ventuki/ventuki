import type { InvoiceItemRecord } from "../types/invoice.types";

export class InvoiceItemEntity {
  constructor(public readonly item: InvoiceItemRecord) {}

  calculateTotal() {
    const subtotal = this.item.qty * this.item.price - (this.item.discount ?? 0);
    const tax = this.item.taxes.reduce((acc, row) => acc + row.amount, 0);
    return Number((subtotal + tax).toFixed(2));
  }

  validate() {
    if (this.item.qty <= 0) throw new Error("Cantidad inválida");
    if (this.item.price < 0) throw new Error("Precio inválido");
    return true;
  }
}
