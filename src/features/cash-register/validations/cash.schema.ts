import { z } from "zod";

export const createSessionSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  cashier_user_id: z.string().uuid(),
  opening_balance: z.number().min(0, "Fondo de caja debe ser mayor o igual a cero"),
  notes: z.string().optional(),
});

export const closeSessionSchema = z.object({
  session_id: z.string().uuid(),
  company_id: z.string().uuid(),
  cashier_user_id: z.string().uuid(),
  counted_cash: z.number().min(0, "Monto entregado debe ser mayor o igual a cero"),
  counted_card: z.number().min(0),
  counted_transfer: z.number().min(0),
  notes: z.string().optional(),
});

export const cashMovementSchema = z.object({
  session_id: z.string().uuid(),
  company_id: z.string().uuid(),
  type: z.enum(["income", "expense", "deposit", "withdrawal"]),
  amount: z.number().positive("El monto debe ser positivo"),
  payment_method: z.enum(["cash", "card", "transfer", "other"]),
  reference: z.string().max(100).optional(),
  description: z.string().min(1, "Debe agregar una descripción"),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
