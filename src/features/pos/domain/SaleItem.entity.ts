import type { CartLine } from "../types/cart.types";

export class SaleItemEntity {
  constructor(public readonly value: CartLine) {}

  get subtotal() {
    return this.value.quantity * this.value.unit_price;
  }

  get discountTotal() {
    return this.subtotal * (this.value.discount_percent / 100);
  }

  get netSubtotal() {
    return this.subtotal - this.discountTotal;
  }

  get taxTotal() {
    return this.netSubtotal * this.value.tax_rate;
  }

  get total() {
    return this.netSubtotal + this.taxTotal;
  }
}
