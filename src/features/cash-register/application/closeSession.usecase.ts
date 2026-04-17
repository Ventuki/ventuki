import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { closeSessionSchema, type CloseSessionInput } from "../validations/cash.schema";
import { ensureCashPermission, type CashPermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function closeSessionUseCase(
  command: CloseSessionInput,
  permissions: CashPermission[]
) {
  ensureCashPermission(permissions, "cash.close");
  const input = closeSessionSchema.parse(command) as any;

  // Ejecuta el cierre de caja, calculando faltante o sobrante (arqueo)
  const { error } = await cashRegisterRepository.closeSession(input);

  if (error) {
    throw new Error("Ocurrió un error al intentar cerrar la caja: " + error.message);
  }

  // Notificar al sistema
  domainEventBus.publish({
    type: "cash.session.closed",
    payload: {
      session_id: input.session_id,
      company_id: input.company_id,
      cashier_user_id: input.cashier_user_id,
      counted_cash: input.counted_cash,
    },
  });

  return { ok: true };
}
