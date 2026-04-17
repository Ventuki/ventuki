import { posConfig } from "../config/pos.config";
import { saleRepository } from "../infrastructure/sale.repository";
import { auditRepository } from "../infrastructure/audit.repository";
import type { CreateSaleCommand } from "../types/sale.types";
import { saleSchema } from "../validations/sale.schema";
import { ensurePermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function createSaleUseCase(
  command: CreateSaleCommand,
  permissions: Array<"pos.create" | "pos.discount" | "pos.cancel">,
) {
  ensurePermission(permissions, "pos.create");
  const input = saleSchema.parse(command) as any;

  const result = await saleRepository.createDraft({
    ...input,
    customer_id: input.customer_id || null,
    currency: posConfig.currency,
    cashier_user_id: input.cashier_user_id,
    invoice_requested: input.invoice_requested,
  });

  if (result.error || !result.data) throw result.error || new Error("No se pudo crear venta");

  await auditRepository.record({
    company_id: input.company_id,
    branch_id: input.branch_id,
    actor_user_id: input.cashier_user_id,
    action: "sale.created",
    target_id: result.data.id,
  });

  // ✅ Bus de eventos global — sin acoplamiento a la UI ni al DOM
  domainEventBus.publish({
    type: "sale.created",
    payload: result.data,
  });

  return result.data;
}
