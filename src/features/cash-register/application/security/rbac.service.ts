export type CashPermission = "cash.open" | "cash.close" | "cash.move";

export function ensureCashPermission(permissions: CashPermission[], required: CashPermission) {
  if (!permissions.includes(required)) {
    throw new Error(`Permiso denegado: ${required}`);
  }
}
