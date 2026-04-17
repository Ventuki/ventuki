import type { ApplyDiscountCommand, CartSnapshot } from "../types/cart.types";
import { validateDiscount } from "../domain/rules";
import { ensurePermission } from "./security/rbac.service";
import { auditRepository } from "../infrastructure/audit.repository";

export async function applyDiscountUseCase(
  snapshot: CartSnapshot,
  command: ApplyDiscountCommand,
  permissions: Array<"pos.create" | "pos.discount" | "pos.cancel">,
): Promise<CartSnapshot> {
  ensurePermission(permissions, "pos.discount");
  const lines = snapshot.lines.map((line) => {
    if (line.id !== command.line_id) return line;
    const updated = { ...line, discount_percent: command.discount_percent };
    validateDiscount(updated);
    return updated;
  });

  await auditRepository.record({
    company_id: command.company_id,
    branch_id: command.branch_id,
    actor_user_id: command.actor_user_id,
    action: "sale.discounted",
    target_id: command.sale_id,
    metadata: { line_id: command.line_id, discount_percent: command.discount_percent },
  });

  return { ...snapshot, lines };
}
