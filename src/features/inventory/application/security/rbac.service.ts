import type { InventoryPermission } from "../../types/inventory.types";

const rolePermissionMap: Record<string, InventoryPermission[]> = {
  admin: ["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"],
  manager: ["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"],
  warehouse_keeper: ["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"],
  purchaser: ["inventory.view", "inventory.kardex"],
  seller: ["inventory.view"],
  cashier: ["inventory.view"],
};

export function getInventoryPermissionsByRole(role?: string): InventoryPermission[] {
  if (!role) return ["inventory.view"];
  return rolePermissionMap[role] || ["inventory.view"];
}

export function ensureInventoryPermission(permissions: InventoryPermission[], required: InventoryPermission) {
  if (!permissions.includes(required)) throw new Error(`Sin permiso: ${required}`);
}
