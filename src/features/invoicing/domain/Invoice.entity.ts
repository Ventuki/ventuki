import type { CreateInvoiceCommand, InvoiceRecord } from "../types/invoice.types";
import { FiscalDataEntity } from "./FiscalData.entity";
import { InvoiceItemEntity } from "./InvoiceItem.entity";
import { TaxCalculationEntity } from "./TaxCalculation.entity";

export class InvoiceEntity {
  constructor(private readonly command: CreateInvoiceCommand) {}

  validateSaleStatus(status: "paid" | "cancelled" | "draft") {
    if (status === "cancelled") {
      throw new Error("No se puede facturar una venta cancelada");
    }
  }

  toRecord(partial: Pick<InvoiceRecord, "id" | "series" | "folio" | "created_at" | "created_by">): InvoiceRecord {
    new FiscalDataEntity(this.command.fiscal_data).validate();
    this.command.items.forEach((item) => new InvoiceItemEntity(item).validate());
    const totals = TaxCalculationEntity.calculate(this.command.items);

    return {
      ...partial,
      company_id: this.command.company_id,
      branch_id: this.command.branch_id,
      sale_id: this.command.sale_id ?? null,
      customer_id: this.command.customer_id ?? null,
      currency: "MXN",
      payment_method: this.command.payment_method,
      payment_form: this.command.payment_form,
      subtotal: totals.subtotal,
      tax: totals.totalTaxes,
      total: totals.total,
      status: "draft",
      uuid: null,
      xml_url: null,
      pdf_url: null,
      stamped_at: null,
      cancelled_at: null,
      cancel_reason: null,
      fiscal_data: this.command.fiscal_data,
    };
  }

  canCancel(hasAppliedCreditNote: boolean) {
    if (hasAppliedCreditNote) {
      throw new Error("No se puede cancelar factura con nota de crédito aplicada");
    }
    return true;
  }
}
