import { describe, expect, it } from "vitest";
import { InvoiceEntity } from "../../domain/Invoice.entity";

describe("InvoiceEntity cancellation", () => {
  it("bloquea cancelación cuando existe nota de crédito aplicada", () => {
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
          price: 10,
          taxes: [],
          total: 10,
        },
      ],
    });

    expect(() => entity.canCancel(true)).toThrowError("No se puede cancelar factura con nota de crédito aplicada");
  });
});
