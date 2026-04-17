export interface TransferRecord {
  id: string;
  company_id: string;
  branch_id: string;
  from_warehouse: string;
  to_warehouse: string;
  product_id: string;
  qty: number;
  status: "pending" | "completed" | "cancelled";
  notes?: string | null;
  created_at: string;
  actor_user_id?: string | null;
}
