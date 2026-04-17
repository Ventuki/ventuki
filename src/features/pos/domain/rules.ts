import type { CartLine } from "../types/cart.types";
import type { TenantContext } from "../types/sale.types";

export function validateStock(line: CartLine): void {
  if (line.quantity > line.stock_available) {
    throw new Error(`Stock insuficiente para ${line.product_name}`);
  }
}

export function validateDiscount(line: CartLine): void {
  if (line.discount_percent < 0 || line.discount_percent > line.max_discount_percent) {
    throw new Error(`Descuento inválido para ${line.product_name}`);
  }
}

export function validateTax(line: CartLine): void {
  if (line.tax_rate < 0 || line.tax_rate > 1) {
    throw new Error(`Impuesto inválido para ${line.product_name}`);
  }
}

export function validateBranch(ctx: TenantContext): void {
  if (!ctx.branch_id || !ctx.company_id || !ctx.warehouse_id) {
    throw new Error("Contexto de sucursal/tenant incompleto");
  }
}
