import { describe, expect, it } from "vitest";
import { TaxCalculationEntity } from "../../domain/TaxCalculation.entity";

describe("TaxCalculationEntity", () => {
  it("calcula subtotal, impuestos y total", () => {
    const result = TaxCalculationEntity.calculate([
      {
        product_id: crypto.randomUUID(),
        description: "Producto 1",
        qty: 2,
        price: 100,
        taxes: [{ code: "002", type: "traslado", rate: 0.16, base: 200, amount: 32 }],
        total: 232,
      },
    ]);

    expect(result.subtotal).toBe(200);
    expect(result.totalTaxes).toBe(32);
    expect(result.total).toBe(232);
  });
});
