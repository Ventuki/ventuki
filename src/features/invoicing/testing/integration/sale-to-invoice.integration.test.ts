import { describe, expect, it } from "vitest";
import { InvoiceEntity } from "../../domain/Invoice.entity";

describe("Integración venta -> factura", () => {
  it("genera totales correctos desde una venta pagada", () => {
    const invoice = new InvoiceEntity({
      company_id: crypto.randomUUID(),
      branch_id: crypto.randomUUID(),
      sale_id: crypto.randomUUID(),
      customer_id: crypto.randomUUID(),
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
          description: "SKU",
          qty: 2,
          price: 250,
          taxes: [{ code: "002", type: "traslado", rate: 0.16, base: 500, amount: 80 }],
          total: 580,
        },
      ],
    }).toRecord({
      id: crypto.randomUUID(),
      series: "A",
      folio: 100,
      created_at: new Date().toISOString(),
      created_by: crypto.randomUUID(),
    });

    expect(invoice.subtotal).toBe(500);
    expect(invoice.tax).toBe(80);
    expect(invoice.total).toBe(580);
  });
});
