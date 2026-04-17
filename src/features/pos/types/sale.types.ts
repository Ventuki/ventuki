export type UUID = string;

export interface TenantContext {
  company_id: UUID;
  branch_id: UUID;
  warehouse_id: UUID;
}

export type SaleStatus = "draft" | "completed" | "cancelled";

export interface SaleTotals {
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
}

export interface SaleRecord extends TenantContext {
  id: UUID;
  customer_id?: UUID | null;
  cashier_user_id: UUID;
  status: SaleStatus;
  currency: string;
  totals: SaleTotals;
  invoice_requested: boolean;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
}

export interface SaleQueryFilters extends TenantContext {
  from?: string;
  to?: string;
  status?: SaleStatus;
}

export interface CreateSaleCommand extends TenantContext {
  cashier_user_id: UUID;
  customer_id?: UUID | null;
  invoice_requested?: boolean;
}

export interface CancelSaleCommand extends TenantContext {
  sale_id: UUID;
  reason: string;
  actor_user_id: UUID;
}
