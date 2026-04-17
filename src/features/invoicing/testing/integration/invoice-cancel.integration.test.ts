import { describe, expect, it } from "vitest";
import { InvoiceEntity } from "../../domain/Invoice.entity";

describe("Integración factura -> cancelación", () => {
  it("permite cancelar cuando no existe nota de crédito", () => {
    const entity = new InvoiceEntity({
      company_id: crypto.randomUUID(),
      branch_id: crypto.randomUUID(),
      created_by: crypto.randomUUID(),
      payment_method: "PUE",
      payment_form: "03",
      fiscal_data: {
        rfc: "XAXX010101000",
        businessName: "Publico General",
        fiscalRegime: "601",
        postalCode: "64000",
        cfdiUse: "S01",
      },
      items: [
        {
          product_id: crypto.randomUUID(),
          description: "Producto",
          qty: 1,
          price: 200,
          taxes: [],
          total: 200,
        },
      ],
    });

    expect(entity.canCancel(false)).toBe(true);
  });
});
