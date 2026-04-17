import type { TenantContext, UUID } from "./sale.types";

export type PaymentMethod = "cash" | "card" | "transfer" | "mixed";

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface ProcessPaymentCommand extends TenantContext {
  sale_id: UUID;
  cashier_user_id: UUID;
  payments: PaymentInput[];
}

export interface SalePaymentRecord extends TenantContext {
  id: UUID;
  sale_id: UUID;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  created_at: string;
}
