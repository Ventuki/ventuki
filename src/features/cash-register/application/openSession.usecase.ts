import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { createSessionSchema, type CreateSessionInput } from "../validations/cash.schema";
import { ensureCashPermission, type CashPermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function openSessionUseCase(
  command: CreateSessionInput,
  permissions: CashPermission[]
) {
  ensureCashPermission(permissions, "cash.open");
  const input = createSessionSchema.parse(command) as any;

  const activeSessionCheck = await cashRegisterRepository.getActiveSession(
    input.company_id,
    input.branch_id,
    input.cashier_user_id
  );

  if (activeSessionCheck.error) {
    throw new Error("No se pudo verificar el estado de la caja");
  }

  if (activeSessionCheck.session) {
    throw new Error("Ya tienes una sesión de caja abierta en esta sucursal");
  }

  const { data: session, error } = await cashRegisterRepository.openSession(input);
  const sessionData = session as any;
  
  if (error || !sessionData) {
    throw error || new Error("No se pudo abrir la caja registradora");
  }

  domainEventBus.publish({
    type: "cash.session.opened",
    payload: {
      session_id: sessionData.id,
      company_id: input.company_id,
      branch_id: input.branch_id,
      cashier_user_id: input.cashier_user_id,
      opening_balance: input.opening_balance,
    },
  });

  return { ok: true, session_id: sessionData.id };
}
