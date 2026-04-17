import { z } from "zod";

export const cancelSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  reason: z.string().min(2, "Motivo de cancelación requerido"),
  performed_by: z.string().uuid(),
});
