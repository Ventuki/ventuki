import type { CartSnapshot } from "../types/cart.types";
import type { SaleRecord } from "../types/sale.types";
import { CartEntity } from "./Cart.entity";

export class SaleEntity {
  constructor(public readonly sale: SaleRecord, private readonly cart: CartSnapshot) {}

  calculateTotals() {
    return new CartEntity(this.cart).totals();
  }

  complete() {
    this.sale.status = "completed";
    this.sale.completed_at = new Date().toISOString();
    this.sale.totals = this.calculateTotals();
    return this.sale;
  }

  cancel() {
    this.sale.status = "cancelled";
    this.sale.cancelled_at = new Date().toISOString();
    return this.sale;
  }
}
