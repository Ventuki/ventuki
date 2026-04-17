import type { TenantContext, UUID } from "./sale.types";

export interface CartLine {
  id: UUID;
  product_id: UUID;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  max_discount_percent: number;
  discount_percent: number;
  stock_available: number;
}

export interface CartSnapshot extends TenantContext {
  sale_id: UUID;
  lines: CartLine[];
  notes?: string;
}

export interface AddProductCommand extends TenantContext {
  sale_id: UUID;
  product_id: UUID;
  quantity: number;
}

export interface RemoveProductCommand extends TenantContext {
  sale_id: UUID;
  line_id: UUID;
}

export interface ApplyDiscountCommand extends TenantContext {
  sale_id: UUID;
  line_id: UUID;
  discount_percent: number;
  actor_user_id: UUID;
}
