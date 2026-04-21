import { CartEntity } from "../domain/Cart.entity";
import type { CartSnapshot } from "../types/cart.types";

export interface CheckoutPaymentLine {
  method: string;
  amount: number;
  reference?: string;
}

const CASH_METHOD_ALIASES = new Set(["cash", "efectivo", "cash_mxn"]);

function normalizeMoney(value: number | string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Number(numeric.toFixed(2)));
}

function isCashMethod(method: string) {
  return CASH_METHOD_ALIASES.has(method.trim().toLowerCase());
}

export function validateCheckoutUseCase(input: {
  cart: CartSnapshot;
  payments: Array<{ method: string; amount: number | string; reference?: string }>;
  company_id?: string;
  branch_id?: string;
  user_id?: string;
  cashSessionReady: boolean;
  checkingCashSession: boolean;
  warehouseReady: boolean;
  checkingWarehouse: boolean;
  paymentConfigReady: boolean;
}) {
  if (!input.user_id) throw new Error("No hay usuario autenticado");
  if (input.checkingCashSession) throw new Error("Espera a que se valide el estado de caja");
  if (!input.cashSessionReady) throw new Error("Debes abrir caja antes de cobrar en el POS");
  if (input.checkingWarehouse) throw new Error("Espera a que se valide el almacén operativo");
  if (!input.warehouseReady) throw new Error("No hay almacén operativo para esta sucursal");
  if (!input.paymentConfigReady) throw new Error("No hay métodos de pago configurados para cobrar");
  if (input.cart.lines.length === 0) throw new Error("Agrega productos antes de cobrar");
  if (!input.company_id || !input.branch_id) throw new Error("Contexto de empresa/sucursal incompleto");
  if (!input.cart.warehouse_id) throw new Error("No se encontró un almacén activo. Configura un almacén para esta sucursal antes de cobrar.");

  const normalizedPayments = input.payments
    .filter((line) => line.method && normalizeMoney(line.amount) > 0)
    .map((line) => ({
      method: line.method,
      amount: normalizeMoney(line.amount),
      reference: line.reference?.trim() || undefined,
    }));

  if (normalizedPayments.length === 0) throw new Error("Captura al menos una línea de pago válida");

  const missingReference = normalizedPayments.some((line) => !isCashMethod(line.method) && !line.reference);
  if (missingReference) throw new Error("Captura referencia para pagos no-efectivo");

  const totals = new CartEntity(input.cart).totals();
  const totalPaid = normalizedPayments.reduce((acc, line) => acc + line.amount, 0);

  if (totalPaid < totals.grand_total) throw new Error("El pago total es insuficiente");

  const nonCashTotal = normalizedPayments
    .filter((line) => !isCashMethod(line.method))
    .reduce((acc, line) => acc + line.amount, 0);

  if (nonCashTotal > totals.grand_total) throw new Error("Los pagos no-efectivo no deben exceder el total de la venta");

  const cashLines = normalizedPayments.filter((line) => isCashMethod(line.method));
  if (cashLines.length === 0 && totalPaid > totals.grand_total) {
    throw new Error("El excedente solo se permite cuando hay pago en efectivo para calcular cambio");
  }

  return {
    normalizedPayments,
    totals,
    totalPaid,
  };
}
