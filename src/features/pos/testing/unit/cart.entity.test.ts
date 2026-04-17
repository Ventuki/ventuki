import { describe, expect, it } from "vitest";
import { CartEntity } from "../../domain/Cart.entity";
import type { CartSnapshot } from "../../types/cart.types";

describe("CartEntity", () => {
  it("calcula totales", () => {
    const cart: CartSnapshot = {
      sale_id: crypto.randomUUID(),
      company_id: crypto.randomUUID(),
      branch_id: crypto.randomUUID(),
      warehouse_id: crypto.randomUUID(),
      lines: [
        {
          id: crypto.randomUUID(),
          product_id: crypto.randomUUID(),
          product_name: "Martillo",
          sku: "MAR-1",
          quantity: 2,
          unit_price: 100,
          tax_rate: 0.16,
          max_discount_percent: 20,
          discount_percent: 10,
          stock_available: 5,
        },
      ],
    };

    const totals = new CartEntity(cart).totals();

    expect(totals.subtotal).toBe(200);
    expect(totals.discount_total).toBe(20);
    expect(totals.tax_total).toBeCloseTo(28.8);
    expect(totals.grand_total).toBeCloseTo(208.8);
  });
});
