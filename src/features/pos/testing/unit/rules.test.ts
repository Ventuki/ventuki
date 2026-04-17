import { describe, expect, it } from "vitest";
import { validateDiscount, validateStock, validateTax } from "../../domain/rules";

describe("Reglas POS", () => {
  it("falla por stock insuficiente", () => {
    expect(() =>
      validateStock({
        id: "1",
        product_id: "2",
        product_name: "Taladro",
        sku: "T-1",
        quantity: 10,
        unit_price: 1,
        tax_rate: 0.16,
        max_discount_percent: 30,
        discount_percent: 0,
        stock_available: 1,
      }),
    ).toThrow(/Stock insuficiente/i);
  });

  it("falla con descuento mayor al permitido", () => {
    expect(() =>
      validateDiscount({
        id: "1",
        product_id: "2",
        product_name: "Taladro",
        sku: "T-1",
        quantity: 1,
        unit_price: 1,
        tax_rate: 0.16,
        max_discount_percent: 10,
        discount_percent: 40,
        stock_available: 9,
      }),
    ).toThrow(/Descuento inválido/i);
  });

  it("falla con tasa de impuesto inválida", () => {
    expect(() =>
      validateTax({
        id: "1",
        product_id: "2",
        product_name: "Taladro",
        sku: "T-1",
        quantity: 1,
        unit_price: 1,
        tax_rate: 9,
        max_discount_percent: 10,
        discount_percent: 0,
        stock_available: 9,
      }),
    ).toThrow(/Impuesto inválido/i);
  });
});
