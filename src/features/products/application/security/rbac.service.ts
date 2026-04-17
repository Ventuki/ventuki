export type ProductPermission = "product.create" | "product.update" | "product.delete";

const rolePermissions: Record<string, ProductPermission[]> = {
  admin: ["product.create", "product.update", "product.delete"],
  manager: ["product.create", "product.update", "product.delete"],
  warehouse_keeper: ["product.create", "product.update"],
  purchaser: ["product.create", "product.update"],
};

export function getProductPermissionsByRole(role?: string): ProductPermission[] {
  if (!role) return [];
  return rolePermissions[role] || [];
}

export function ensureProductPermission(permissions: ProductPermission[], permission: ProductPermission) {
  if (!permissions.includes(permission)) {
    throw new Error(`Permiso denegado: ${permission}`);
  }
}
