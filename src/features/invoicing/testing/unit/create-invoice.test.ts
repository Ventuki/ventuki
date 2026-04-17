import { describe, expect, it } from "vitest";
import { InvoiceEntity } from "../../domain/Invoice.entity";

describe("InvoiceEntity", () => {
  it("construye una factura válida", () => {
    const command = {
      company_id: crypto.randomUUID(),
      branch_id: crypto.randomUUID(),
      sale_id: crypto.randomUUID(),
      customer_id: crypto.randomUUID(),
      created_by: crypto.randomUUID(),
      payment_method: "PUE" as const,
      payment_form: "03" as const,
      fiscal_data: {
        rfc: "XAXX010101000",
        businessName: "Publico General",
        fiscalRegime: "601",
        postalCode: "64000",
        cfdiUse: "S01" as const,
      },
      items: [
        {
          product_id: crypto.randomUUID(),
          description: "Producto",
          qty: 1,
          price: 100,
          taxes: [{ code: "002", type: "traslado" as const, rate: 0.16, base: 100, amount: 16 }],
          total: 116,
        },
      ],
    };

    const invoice = new InvoiceEntity(command).toRecord({
      id: crypto.randomUUID(),
      series: "A",
      folio: 1,
      created_at: new Date().toISOString(),
      created_by: command.created_by,
    });

    expect(invoice.total).toBe(116);
    expect(invoice.status).toBe("draft");
  });
});
