import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { cashMovementSchema, type CashMovementInput } from "../validations/cash.schema";
import { ensureCashPermission, type CashPermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function recordCashMovementUseCase(
  command: CashMovementInput,
  permissions: CashPermission[]
) {
  ensureCashPermission(permissions, "cash.move");
  const input = cashMovementSchema.parse(command) as any;

  const { data: movement, error } = await cashRegisterRepository.recordMovement(input);
  const movementData = movement as any;
  
  if (error || !movementData) {
    throw error || new Error("No se pudo registrar el movimiento de caja");
  }

  domainEventBus.publish({
    type: "cash.movement.recorded",
    payload: {
      movement_id: movementData.id,
      session_id: input.session_id,
      company_id: input.company_id,
      amount: input.amount,
      type: input.type,
    },
  });

  return { ok: true, movement_id: movementData.id };
}
