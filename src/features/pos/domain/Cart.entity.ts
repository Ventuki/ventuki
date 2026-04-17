import type { CartLine, CartSnapshot } from "../types/cart.types";
import { SaleItemEntity } from "./SaleItem.entity";

export class CartEntity {
  constructor(private readonly snapshot: CartSnapshot) {}

  get lines(): CartLine[] {
    return this.snapshot.lines;
  }

  addLine(line: CartLine) {
    this.snapshot.lines.push(line);
    return this;
  }

  removeLine(lineId: string) {
    this.snapshot.lines = this.snapshot.lines.filter((line) => line.id !== lineId);
    return this;
  }

  totals() {
    const items = this.snapshot.lines.map((line) => new SaleItemEntity(line));
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const discount_total = items.reduce((acc, item) => acc + item.discountTotal, 0);
    const tax_total = items.reduce((acc, item) => acc + item.taxTotal, 0);
    const grand_total = items.reduce((acc, item) => acc + item.total, 0);

    return { subtotal, discount_total, tax_total, grand_total };
  }
}
