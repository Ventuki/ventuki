import type { StockRecord } from "../types/inventory.types";

export function filterByBranch(rows: StockRecord[], branch_id?: string) {
  if (!branch_id) return rows;
  return rows.filter((r) => r.branch_id === branch_id);
}
