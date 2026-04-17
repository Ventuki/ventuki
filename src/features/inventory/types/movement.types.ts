import type { InventoryMovementType } from "./inventory.types";

export interface MovementRecord {
  id: string;
  company_id: string;
  branch_id: string;
  warehouse_id: string;
  product_id: string;
  qty: number;
  type: InventoryMovementType;
  reference?: string | null;
  notes?: string | null;
  created_at: string;
  actor_user_id?: string | null;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
}
