import type { InvoicePermission } from "../../types/invoice.types";

export function ensureInvoicePermission(permissions: InvoicePermission[], required: InvoicePermission) {
  if (!permissions.includes(required)) {
    throw new Error(`Permiso denegado: ${required}`);
  }
}
