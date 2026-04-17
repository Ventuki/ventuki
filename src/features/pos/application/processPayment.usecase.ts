import { CartEntity } from "../domain/Cart.entity";
import { PaymentEntity } from "../domain/Payment.entity";
import { processPaymentSchema } from "../validations/payment.schema";
import type { CartSnapshot } from "../types/cart.types";
import type { ProcessPaymentCommand } from "../types/payment.types";
import { posLogger } from "../infrastructure/logger";
import { domainEventBus } from "@/lib/events/domainEventBus";
import { supabase } from "@/integrations/supabase/client";

export async function processPaymentUseCase(cart: CartSnapshot, command: ProcessPaymentCommand) {
  const input = processPaymentSchema.parse(command) as any;
  const totals = new CartEntity(cart).totals();
  const paymentEntity = new PaymentEntity(input.payments);

  if (paymentEntity.totalPaid() < totals.grand_total) {
    posLogger.warn("venta fallida por pago insuficiente", { saleId: input.sale_id });
    throw new Error("Monto insuficiente para cerrar la venta");
  }

  // Construir payloads para el RPC atÃ³mico
  const itemsPayload = cart.lines.map((line) => ({
    product_id: line.product_id,
    product_name: line.product_name,
    sku: line.sku,
    quantity: line.quantity,
    unit_price: line.unit_price,
    tax_rate: line.tax_rate,
    discount_percent: line.discount_percent,
  }));

  const paymentsPayload = input.payments.map((p) => ({
    method: p.method,
    amount: p.amount,
    reference: p.reference ?? null,
  }));

  const totalsPayload = {
    subtotal: totals.subtotal,
    discount_total: totals.discount_total,
    tax_total: totals.tax_total,
    grand_total: totals.grand_total,
  };

  // âœ… Una sola transacciÃ³n DB: descuenta stock + inserta pagos + completa venta + registra caja
  const { data: result, error } = await supabase.rpc("process_sale_payment" as any, {
    _sale_id: input.sale_id,
    _company_id: input.company_id,
    _branch_id: input.branch_id,
    _warehouse_id: input.warehouse_id,
    _cashier_user_id: input.cashier_user_id,
    _items: itemsPayload,
    _payments: paymentsPayload,
    _totals: totalsPayload,
  } as any);

  if (error) {
    posLogger.error("proceso de pago fallido", { saleId: input.sale_id, error });
    throw error;
  }

  // Emitir eventos via bus global (no mÃ¡s window.dispatchEvent en use cases)
  domainEventBus.publish({
    type: "sale.completed",
    payload: {
      sale_id: input.sale_id,
      company_id: input.company_id,
      branch_id: input.branch_id,
      warehouse_id: input.warehouse_id,
      cashier_user_id: input.cashier_user_id,
      totals,
      items: itemsPayload,
    },
  });

  domainEventBus.publish({
    type: "stock.adjusted",
    payload: {
      company_id: input.company_id,
      warehouse_id: input.warehouse_id,
      items: itemsPayload,
      reason: "sale",
    },
  });

  domainEventBus.publish({
    type: "cash.income",
    payload: {
      company_id: input.company_id,
      branch_id: input.branch_id,
      sale_id: input.sale_id,
      amount: totals.grand_total,
    },
  });

  posLogger.info("venta completada atÃ³micamente", { saleId: input.sale_id, total: totals.grand_total });

  return { ok: true, result, totals };
}


