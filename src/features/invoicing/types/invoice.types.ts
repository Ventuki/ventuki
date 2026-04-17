import type { CFDIUse, PaymentForm, PaymentMethod } from "./cfdi.types";
import type { TaxLine } from "./tax.types";

export type InvoiceStatus = "draft" | "stamped" | "cancelled" | "error";

export interface TenantContext {
  company_id: string;
  branch_id: string;
}

export interface InvoiceItemRecord {
  id?: string;
  invoice_id?: string;
  product_id: string;
  description: string;
  qty: number;
  price: number;
  discount?: number;
  taxes: TaxLine[];
  total: number;
}

export interface FiscalDataRecord {
  rfc: string;
  businessName: string;
  fiscalRegime: string;
  postalCode: string;
  cfdiUse: CFDIUse;
}

export interface InvoiceRecord extends TenantContext {
  id: string;
  sale_id: string | null;
  customer_id: string | null;
  series: string;
  folio: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_form: PaymentForm;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  uuid: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  stamped_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_by: string;
  created_at: string;
  fiscal_data: FiscalDataRecord;
}

export interface CreditNoteRecord extends TenantContext {
  id: string;
  invoice_id: string;
  amount: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface CreateInvoiceCommand extends TenantContext {
  sale_id?: string | null;
  customer_id?: string | null;
  created_by: string;
  payment_method: PaymentMethod;
  payment_form: PaymentForm;
  fiscal_data: FiscalDataRecord;
  items: InvoiceItemRecord[];
}

export interface CancelInvoiceCommand extends TenantContext {
  invoice_id: string;
  reason: string;
  performed_by: string;
}

export interface CreateCreditNoteCommand extends TenantContext {
  invoice_id: string;
  amount: number;
  reason: string;
  performed_by: string;
}

export interface RetryStampCommand extends TenantContext {
  invoice_id: string;
  performed_by: string;
}

export interface SendInvoiceEmailCommand extends TenantContext {
  invoice_id: string;
  to: string;
  performed_by: string;
}

export interface InvoiceQuery extends TenantContext {
  from?: string;
  to?: string;
  sale_id?: string;
  status?: InvoiceStatus;
}

export type InvoicePermission =
  | "invoice.view"
  | "invoice.create"
  | "invoice.cancel"
  | "invoice.credit_note"
  | "invoice.download";
