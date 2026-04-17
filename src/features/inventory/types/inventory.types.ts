export type InventoryPermission = "inventory.view" | "inventory.adjust" | "inventory.transfer" | "inventory.kardex";

export type InventoryMovementType =
  | "adjustment_in"
  | "adjustment_out"
  | "transfer_in"
  | "transfer_out"
  | "reserve"
  | "release"
  | "sale_out"
  | "purchase_in"
  | "count_adjustment";

export interface TenantContext {
  company_id: string;
  branch_id: string;
  warehouse_id: string;
  actor_user_id?: string;
  actor_role?: string;
}

export interface StockRecord {
  id: string;
  company_id: string;
  branch_id: string;
  warehouse_id: string;
  product_id: string;
  qty: number;
  reserved_qty: number;
  min_qty: number;
  max_qty: number | null;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  branch_name?: string;
}

export interface StockAlert {
  product_id: string;
  warehouse_id: string;
  qty: number;
  min_qty: number;
  max_qty: number | null;
  severity: "low" | "overflow";
}

export interface Pagination {
  limit?: number;
  offset?: number;
}

export interface InventoryAuditRecord {
  company_id: string;
  branch_id: string;
  actor_user_id?: string;
  action: string;
  target_id?: string;
  payload?: Record<string, unknown>;
}
