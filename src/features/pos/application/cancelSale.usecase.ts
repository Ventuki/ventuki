import type { CancelSaleCommand } from "../types/sale.types";
import { ensurePermission } from "./security/rbac.service";
import { saleRepository } from "../infrastructure/sale.repository";
import { auditRepository } from "../infrastructure/audit.repository";

export async function cancelSaleUseCase(command: CancelSaleCommand, permissions: Array<"pos.create" | "pos.discount" | "pos.cancel">) {
  ensurePermission(permissions, "pos.cancel");

  const result = await saleRepository.cancel(command.sale_id, command, command.reason);
  if ((result as any).error) throw (result as any).error;

  await auditRepository.record({
    company_id: command.company_id,
    branch_id: command.branch_id,
    actor_user_id: command.actor_user_id,
    action: "sale.cancelled",
    target_id: command.sale_id,
    metadata: { reason: command.reason },
  });

  return { cancelled: true };
}
