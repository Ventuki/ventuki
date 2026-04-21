import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { z } from "zod";

const listRecentSessionsSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  cashier_user_id: z.string().uuid(),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function listRecentSessionsUseCase(command: {
  company_id: string;
  branch_id: string;
  cashier_user_id: string;
  limit?: number;
}) {
  const input = listRecentSessionsSchema.parse(command);
  const result = await cashRegisterRepository.listRecentSessions(
    input.company_id,
    input.branch_id,
    input.cashier_user_id,
    input.limit || 5,
  );

  if (result.error) {
    throw result.error;
  }

  return result.data;
}
