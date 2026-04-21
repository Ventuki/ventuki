import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { z } from "zod";

const getSessionDetailSchema = z.object({
  session_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export async function getSessionDetailUseCase(command: { session_id: string; company_id: string }) {
  const input = getSessionDetailSchema.parse(command);

  const [summaryResult, movementsResult] = await Promise.all([
    cashRegisterRepository.getSessionSummary(input.session_id, input.company_id),
    cashRegisterRepository.listSessionMovements(input.company_id, input.session_id),
  ]);

  if (summaryResult.error) throw summaryResult.error;
  if (!summaryResult.session) throw new Error("No se encontró la sesión de caja");
  if (movementsResult.error) throw movementsResult.error;

  return {
    session: summaryResult.session,
    totals: summaryResult.totals,
    movements: movementsResult.data,
  };
}
