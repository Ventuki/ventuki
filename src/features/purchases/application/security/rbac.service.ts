export type PurchasePermission = "purchase.view" | "purchase.create" | "purchase.receive" | "purchase.cancel";

export function ensurePurchasePermission(permissions: PurchasePermission[], required: PurchasePermission) {
  if (!permissions.includes(required)) {
    throw new Error(`Permiso denegado: ${required}`);
  }
}
