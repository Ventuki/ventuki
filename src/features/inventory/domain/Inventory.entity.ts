import type { StockRecord } from "../types/inventory.types";

export class Inventory {
  constructor(public readonly items: StockRecord[]) {}

  byWarehouse(warehouse_id: string) {
    return this.items.filter((i) => i.warehouse_id === warehouse_id);
  }

  byBranch(branch_id: string) {
    return this.items.filter((i) => i.branch_id === branch_id);
  }

  cedisStock() {
    return this.items.filter((i) => (i.warehouse_name || "").toLowerCase().includes("cedis"));
  }
}
