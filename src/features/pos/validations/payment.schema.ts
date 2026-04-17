import { z } from "zod";

export const paymentSchema = z.object({
  method: z.string().min(1, "Metodo de pago requerido"),
  amount: z.number().positive(),
  reference: z.string().max(120).optional(),
});

export const processPaymentSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  sale_id: z.string().uuid(),
  cashier_user_id: z.string().uuid(),
  payments: z.array(paymentSchema).min(1),
});
