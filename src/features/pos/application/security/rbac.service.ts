export type POSPermission = "pos.create" | "pos.discount" | "pos.cancel";

export function ensurePermission(permissions: POSPermission[], required: POSPermission) {
  if (!permissions.includes(required)) {
    throw new Error(`Permiso denegado: ${required}`);
  }
}

const rolePermissionMap: Record<string, POSPermission[]> = {
  admin: ["pos.create", "pos.discount", "pos.cancel"],
  manager: ["pos.create", "pos.discount", "pos.cancel"],
  cashier: ["pos.create", "pos.discount"],
  seller: ["pos.create", "pos.discount"],
  accountant: ["pos.create"],
};

export function getPOSPermissionsByRole(role?: string): POSPermission[] {
  if (!role) return ["pos.create"];
  return rolePermissionMap[role] || ["pos.create"];
}
