import type { InventoryMovementType } from "../types/inventory.types";

export const inventoryConfig = {
  allowNegativeStock: false,
  lowStockAlertsEnabled: true,
  movementTypes: [
    "adjustment_in",
    "adjustment_out",
    "transfer_in",
    "transfer_out",
    "reserve",
    "release",
    "sale_out",
    "purchase_in",
    "count_adjustment",
  ] satisfies InventoryMovementType[],
} as const;
