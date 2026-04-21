import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { z } from "zod";

const getSessionSummarySchema = z.object({
  session_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export async function getSessionSummaryUseCase(command: { session_id: string; company_id: string }) {
  const input = getSessionSummarySchema.parse(command);

  const { session, totals, error } = await cashRegisterRepository.getSessionSummary(input.session_id, input.company_id);

  if (error) {
    throw error;
  }

  if (!session) {
    throw new Error("No se encontró la sesión de caja");
  }

  return { session, totals };
}
